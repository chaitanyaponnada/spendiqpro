# SpendWise

**Smart Shopping, Smarter Savings.**

SpendWise is an intelligent shopping assistant designed to help users manage their grocery budget, find the best deals, and make informed purchasing decisions. It features a user-friendly interface for shoppers and a powerful back-office dashboard for store owners to manage products, view analytics, and interact with customers.

## Core Features

### For Customers:

-   **Budget Tracking:** Set a shopping budget and track your spending in real-time with a dynamic progress bar that changes color as you approach your limit.
-   **Barcode Scanner:** Use your device's camera to scan product barcodes and instantly add items to your virtual cart. Manual entry is also supported.
-   **Interactive Shopping Cart:** Easily view and manage all items in your cart. Adjust quantities, remove items, and see your total cost update instantly.
-   **AI-Powered Savings Finder:**
    -   **Smart Savings:** The AI analyzes your cart and suggests similar, cheaper alternatives from the store's inventory, showing you a direct comparison and potential savings.
    -   **SpendIQ Treasures:** Discover the best deals and highest-discount items currently available in the store, curated by an AI "Treasure Hunter."
-   **Shopping List Management:**
    -   **AI Extraction:** Take a photo of a handwritten or digital shopping list, and the AI will automatically extract the items and add them to a "Today's List."
    -   **Manual & Voice Entry:** Add items to your list by typing or using your voice.
    -   **Past Lists:** Previously purchased lists are saved to your profile, allowing you to reuse them for future shopping trips.
-   **Secure Checkout & History:** Experience a smooth, simulated checkout process. All your past purchases are saved in your profile for easy review.
-   **User Authentication & Profile:** Securely sign up and log in. Manage your profile details and access your purchase history.

### For Store Owners:

-   **Admin Dashboard:** A central hub for managing the store's operations.
-   **Sales Analytics:** A comprehensive dashboard to visualize key metrics like total revenue, number of orders, and average order value. Filter data by time periods (today, 7 days, 30 days, all time).
-   **Product Management:**
    -   Easily add new products with standard or discounted pricing.
    -   Search for existing products by barcode to edit their details, including name, price, brand, and images.
    -   Create and manage sales by setting an "Original Price" higher than the current price.
-   **Category Management:** Dynamically create, view, and search for product categories to keep your inventory organized.
-   **Customer Feedback & Support:**
    -   View customer ratings and comments in a dedicated feedback panel.
    -   Review and respond to customer support tickets, which can include attached images for clarity.

## Tech Stack

-   **Frontend:** Next.js, React, TypeScript
-   **Styling:** Tailwind CSS, ShadCN UI Components
-   **Backend & Database:** Firebase (Authentication, Firestore, Storage)
-   **Artificial Intelligence:** Google's Genkit for AI flows (product suggestions, deal finding, list extraction)
