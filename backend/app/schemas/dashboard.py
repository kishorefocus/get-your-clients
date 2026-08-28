from pydantic import BaseModel

class KpiItem(BaseModel):
    label: str
    rawValue: float
    display: str
    delta: str
    spark: list[float]

class ActivityItem(BaseModel):
    id: str
    name: str
    city: str | None = None
    country: str | None = None
    category: str | None = None
    lat: float | None = None
    lng: float | None = None
    countryCode: str | None = None
    stage: str | None = None

class CountryPctItem(BaseModel):
    country: str
    pct: float

class DashboardOverviewResponse(BaseModel):
    kpis: list[KpiItem]
    activity: list[ActivityItem]
    top_countries: list[CountryPctItem]


class AnalyticsKpiItem(BaseModel):
    label: str
    rawValue: float
    display: str
    delta: str

class WeeklyPerformanceItem(BaseModel):
    week: str
    outreach: int
    responses: int
    deals: int

class CountryMetricItem(BaseModel):
    country: str
    code: str
    leads: int
    won: int

class RepStatItem(BaseModel):
    id: str
    name: str
    dealsWon: int
    outreachSent: int
    responseRate: float
    callsMade: int

class FunnelStageItem(BaseModel):
    stage: str
    label: str
    count: int
    color: str

class DashboardAnalyticsResponse(BaseModel):
    kpis: list[AnalyticsKpiItem]
    weeklyPerformance: list[WeeklyPerformanceItem]
    countryMetrics: list[CountryMetricItem]
    repStats: list[RepStatItem]
    funnelData: list[FunnelStageItem]
