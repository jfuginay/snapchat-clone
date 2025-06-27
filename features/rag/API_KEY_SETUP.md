# 🚀 API Key Setup for Local Knowledge RAG

To power the Local Knowledge RAG feature, you need to obtain API keys from several third-party services. This guide will walk you through the process.

## 1. 🎯 Google Places API Key

This is the most critical key for fetching rich data about businesses and points of interest.

### How to Get Your Key:

1.  **Go to Google Cloud Console**: Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2.  **Select or Create a Project**: Use the project dropdown at the top of the page to select the same project you used for Google Sign-In, or create a new one.
3.  **Enable the API**:
    *   In the navigation menu, go to **APIs & Services -> Library**.
    *   Search for **"Places API"**.
    *   Click on it and then click the **"Enable"** button.
4.  **Create Credentials**:
    *   Go to **APIs & Services -> Credentials**.
    *   Click **"+ CREATE CREDENTIALS"** and select **"API key"**.
5.  **Secure Your Key (IMPORTANT)**:
    *   A pop-up will show your new API key. Click **"EDIT API KEY"**.
    *   Under "Application restrictions," select **"IP addresses"** and add the IP addresses of your development machine and any servers that will call the API. For mobile apps, you might need to restrict it by application identifier (iOS bundle ID, Android package name). This prevents others from using your key.
    *   Under "API restrictions," select **"Restrict key"** and choose only the **"Places API"**.
6.  **Copy the Key**: Once secured, copy the API key.

### Add Key to Your Project:

1.  Open your `.env` file (create it from `env-template.txt` if it doesn't exist).
2.  Add the following line:
    ```
    GOOGLE_PLACES_API_KEY="YOUR_API_KEY_HERE"
    ```

## 2. 🛠️ Future API Keys (Foursquare, Eventbrite)

As we expand the feature, we will need keys for other services. Here's a quick reference for when we add them.

### Foursquare Places API

-   **Use Case**: User-generated tips and venue details.
-   **Get Key**: Create an account at the [Foursquare for Developers](https://location.foursquare.com/developer/) portal.
-   **`.env` variable**: `FOURSQUARE_API_KEY`

### Eventbrite API

-   **Use Case**: Finding local events, concerts, and meetups.
-   **Get Key**: Create an account on [Eventbrite](https://www.eventbrite.com/) and register your application in their developer portal.
-   **`.env` variable**: `EVENTBRITE_API_KEY`

## 3. ✅ Verification

To ensure everything is working:
-   After adding your `GOOGLE_PLACES_API_KEY` to `.env`, restart your application's bundler (`npm start` or `npx expo start`).
-   The app should launch without any errors related to the API key.
-   The `GooglePlacesService.ts` will now be able to make authenticated requests.

"That's what she said." - Michael Scott 