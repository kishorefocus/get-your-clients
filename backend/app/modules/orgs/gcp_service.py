import logging
from typing import Any
import httpx

logger = logging.getLogger(__name__)

CLOUD_RESOURCE_MANAGER_URL = "https://cloudresourcemanager.googleapis.com/v1/projects"
GEOCODE_TEST_URL = "https://maps.googleapis.com/maps/api/geocode/json"


async def validate_maps_api_key(api_key: str) -> tuple[bool, str]:
    """Tests an API key against Google Maps Geocoding API to check if it's active and valid."""
    if not api_key or not api_key.strip():
        return False, "API key cannot be empty"

    clean_key = api_key.strip()
    if not clean_key.startswith("AIza"):
        return False, "Invalid key format — Google Maps API keys typically start with 'AIza'"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                GEOCODE_TEST_URL,
                params={"address": "New York, NY", "key": clean_key},
            )
            data = resp.json()
            status = data.get("status")

            if status in ("OK", "ZERO_RESULTS"):
                return True, "Google Maps API Key is active and verified."
            elif status == "REQUEST_DENIED":
                err = data.get("error_message", "Google Maps request was denied.")
                logger.warning("Google Maps key validation rejected: %s", err)
                # Some keys might be restricted by IP or HTTP referrer, but still functionally valid
                if "referer" in err.lower() or "ip" in err.lower():
                    return True, f"Key accepted with restrictions: {err}"
                return False, f"Google Maps API rejected key: {err}"
            elif status == "OVER_QUERY_LIMIT":
                return True, "Key is recognized by Google (query quota limit reached)."
            else:
                return True, f"Key responded with status: {status}"
    except Exception as exc:
        logger.warning("Could not reach Google Maps geocoding service: %s", exc)
        # Network timeout or DNS issue; if format is AIzaSy..., accept with notice
        if clean_key.startswith("AIzaSy"):
            return True, "Key format looks valid, but network verification timed out."
        return False, f"Verification failed: {exc}"


async def fetch_or_create_gcp_maps_key(google_access_token: str) -> dict[str, Any]:
    """
    Given a Google OAuth access_token with scope `https://www.googleapis.com/auth/cloud-platform`,
    lists the user's GCP projects, finds or creates an API key, and returns the key string.
    """
    # Dev mode simulation
    if google_access_token and google_access_token.startswith("dev_mock_"):
        return {
            "status": "connected",
            "api_key": "AIzaSyDevAutoProvisionedKey99X",
            "project_id": "globalreach-crm-demo",
            "message": "Simulated Google Cloud connection: automatically imported Google Maps API key.",
        }

    headers = {
        "Authorization": f"Bearer {google_access_token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Step 1: List user's GCP projects
        try:
            proj_resp = await client.get(CLOUD_RESOURCE_MANAGER_URL, headers=headers)
        except Exception as exc:
            logger.error("Failed to connect to Google Cloud Resource Manager: %s", exc)
            return {
                "status": "error",
                "message": f"Connection to Google Cloud failed: {exc}",
                "console_url": "https://console.cloud.google.com/projectcreate",
            }

        if proj_resp.status_code == 401:
            return {
                "status": "error",
                "message": "Google Cloud authentication expired or was revoked. Please authenticate again.",
                "console_url": "https://console.cloud.google.com",
            }

        if proj_resp.status_code == 403:
            return {
                "status": "requires_activation",
                "message": "Google Cloud Resource Manager API is not enabled or requires billing/permissions on your Google account.",
                "console_url": "https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com",
            }

        proj_data = proj_resp.json()
        projects = proj_data.get("projects") or []

        # Filter active projects
        active_projects = [p for p in projects if p.get("lifecycleState") == "ACTIVE"]
        if not active_projects:
            # If no active projects found
            if not projects:
                return {
                    "status": "no_projects",
                    "message": "No Google Cloud projects found on this Google account. Please create a project or paste your key manually.",
                    "console_url": "https://console.cloud.google.com/projectcreate",
                }
            active_projects = projects

        # Use the first active project
        target_project = active_projects[0]
        project_id = target_project.get("projectId")
        project_name = target_project.get("name") or project_id

        # Step 2: Try listing keys from the API Keys API
        keys_url = f"https://apikeys.googleapis.com/v2/projects/{project_id}/locations/global/keys"
        try:
            keys_resp = await client.get(keys_url, headers=headers)
        except Exception as exc:
            logger.error("Failed to list GCP API keys: %s", exc)
            return {
                "status": "error",
                "project_id": project_id,
                "message": f"Failed to retrieve API keys from project '{project_name}': {exc}",
                "console_url": f"https://console.cloud.google.com/google/maps-apis/credentials?project={project_id}",
            }

        if keys_resp.status_code == 403:
            # API Keys API not enabled in this project
            # Attempt to auto-enable it via Service Usage API
            try:
                enable_url = f"https://serviceusage.googleapis.com/v1/projects/{project_id}/services/apikeys.googleapis.com:enable"
                await client.post(enable_url, headers=headers)
                # Retry listing keys once
                keys_resp = await client.get(keys_url, headers=headers)
            except Exception:
                pass

        if keys_resp.status_code == 403:
            return {
                "status": "requires_activation",
                "project_id": project_id,
                "message": f"API Keys API is not enabled for project '{project_name}'. Click below to enable it in Google Cloud.",
                "console_url": f"https://console.cloud.google.com/apis/library/apikeys.googleapis.com?project={project_id}",
            }

        if keys_resp.status_code != 200:
            return {
                "status": "error",
                "project_id": project_id,
                "message": f"Could not retrieve keys from project '{project_name}' (Status {keys_resp.status_code}).",
                "console_url": f"https://console.cloud.google.com/google/maps-apis/credentials?project={project_id}",
            }

        keys_data = keys_resp.json()
        keys_list = keys_data.get("keys") or []

        # Step 3: If keys exist, get key string for the best matching key
        for key_obj in keys_list:
            key_name = key_obj.get("name")  # format: projects/{project}/locations/global/keys/{key_id}
            if not key_name:
                continue

            get_string_url = f"https://apikeys.googleapis.com/v2/{key_name}:getKeyString"
            try:
                str_resp = await client.post(get_string_url, headers=headers)
                if str_resp.status_code == 200:
                    key_string = str_resp.json().get("keyString")
                    if key_string and key_string.startswith("AIza"):
                        # Best-effort enable Places & Maps APIs in the background
                        try:
                            await client.post(
                                f"https://serviceusage.googleapis.com/v1/projects/{project_id}/services/places.googleapis.com:enable",
                                headers=headers,
                            )
                        except Exception:
                            pass

                        return {
                            "status": "connected",
                            "api_key": key_string,
                            "project_id": project_id,
                            "message": f"Successfully retrieved API key from Google Cloud project '{project_name}'.",
                        }
            except Exception as exc:
                logger.warning("Error fetching keyString for %s: %s", key_name, exc)

        # Step 4: If no key existed, attempt to create one
        create_url = f"https://apikeys.googleapis.com/v2/projects/{project_id}/locations/global/keys"
        create_body = {"displayName": "GlobalReach CRM Maps Key"}
        try:
            create_resp = await client.post(create_url, headers=headers, json=create_body)
            if create_resp.status_code in (200, 201):
                new_key_op = create_resp.json()
                # If it's a long-running operation or returns the key directly
                target_key_name = None
                if "response" in new_key_op and "name" in new_key_op["response"]:
                    target_key_name = new_key_op["response"]["name"]
                elif "name" in new_key_op and "/keys/" in new_key_op["name"]:
                    target_key_name = new_key_op["name"]

                if target_key_name:
                    str_resp = await client.post(f"https://apikeys.googleapis.com/v2/{target_key_name}:getKeyString", headers=headers)
                    if str_resp.status_code == 200:
                        key_string = str_resp.json().get("keyString")
                        if key_string:
                            return {
                                "status": "connected",
                                "api_key": key_string,
                                "project_id": project_id,
                                "message": f"Created new Google Maps API key in project '{project_name}'.",
                            }
        except Exception as exc:
            logger.warning("Could not auto-create key in project %s: %s", project_id, exc)

        # Fallback: We found the project, but key creation needs manual click in Google Console
        return {
            "status": "requires_activation",
            "project_id": project_id,
            "message": f"Found project '{project_name}', but could not auto-extract a key string. Please click below to view or create your Maps API key in Google Cloud Console.",
            "console_url": f"https://console.cloud.google.com/google/maps-apis/credentials?project={project_id}",
        }
