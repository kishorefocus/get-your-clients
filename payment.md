check the project frontned  and backend i need to chnage the payment method from paddle to razor pay 
razor test keys are Test API Key  rzp_test_TixutCSc1Jzm0f
Test Key Secret 5o2ZgW7TONtk0AzRIAKxHZ65
implement properly with backend and frontend properly 

Build the Python Backend (FastAPI Example)
First, install the official Python SDK wrapper for Razorpay:
bash
pip install razorpay fastapi uvicorn pydantic
Use code with caution.
Create your backend server logic. The client will hit this endpoint to generate a verified, server-signed Order ID:
python
import razorpay
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Enable CORS so Next.js frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Your Next.js local URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Razorpay Client with your Test Keys
RAZORPAY_KEY_ID = "YOUR_RAZORPAY_KEY_ID"
RAZORPAY_KEY_SECRET = "YOUR_RAZORPAY_KEY_SECRET"

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class OrderRequest(BaseModel):
    amount: int  # Amount in the smallest currency unit (e.g., Paise for INR)
    currency: str = "INR"

class VerificationRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@app.post("/api/razorpay/create-order")
async def create_order(order_data: OrderRequest):
    """Step 1: Initialize the order payload directly on Razorpay servers"""
    try:
        data = {
            "amount": order_data.amount,  # e.g., ₹500 is passed as 50000 paise
            "currency": order_data.currency,
            "payment_capture": 1  # 1 means automatic capture upon authorization
        }
        razorpay_order = client.order.create(data=data)
        return razorpay_order  # Returns the order schema including the unique ID
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/razorpay/verify-payment")
async def verify_payment(data: VerificationRequest):
    """Step 2: Authenticate the signature cryptographic hash returned from client"""
    try:
        # Verifies the validity of the payment received against the secret
        params_dict = {
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        }
        client.utility.verify_payment_signature(params_dict)
        
        # PRO TIP: Safe to update database state to 'PAID' here
        return {"success": True, "message": "Payment verified successfully!"}
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Cryptographic signature mismatch")
Use code with caution.
Step 3: Create the Next.js Frontend
First, add your Key ID to your public environment configurations (.env.local):
env
NEXT_PUBLIC_RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY_ID
Use code with caution.
Create a client payment trigger component (components/RazorpayButton.jsx). This script pulls Razorpay's custom checkout code dynamically onto your client page:
jsx
"use client";
import React, { useState } from "react";

export default function RazorpayButton({ amountInRupees }) {
  const [loading, setLoading] = useState(false);

  // Helper to pull the dynamic Razorpay visual script bundle safely
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://razorpay.com";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    const resScript = await loadRazorpayScript();

    if (!resScript) {
      alert("Razorpay SDK failed to load. Check your internet connection.");
      setLoading(false);
      return;
    }

    try {
      // 1. Ask Python backend to register a unique transaction order matching the target amount
      const orderRes = await fetch("http://localhost:8000/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountInRupees * 100, currency: "INR" }), // Converted to paise
      });
      const orderData = await orderRes.json();

      // 2. Set UI layout properties and link callbacks
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Your App Name",
        description: "Premium Subscription Plan",
        order_id: orderData.id, // Linked to the order created by your Python backend
        handler: async function (response) {
          // 3. User completed payment flow. Submit token payload back to Python to verify signature integrity
          const verifyRes = await fetch("http://localhost:8000/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          
          const verificationResult = await verifyRes.json();
          if (verificationResult.success) {
            alert("Payment completed and verified successfully!");
          } else {
            alert("Payment signature validation failed.");
          }
        },
        prefill: {
          name: "Test Customer",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: { color: "#3399cc" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Checkout process interrupted", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Processing..." : `Pay ₹${amountInRupees}`}
    </button>
  );
}