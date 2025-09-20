# Google Maps API Setup Guide

## 🚨 **Current Issue: API Key Configuration**

The address search is working with fallback data, but the Google Places API is returning a 404 error because the API key is not properly configured.

## 🔧 **How to Fix This**

### **Step 1: Get a Google Maps API Key**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API**
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Directions API**

### **Step 2: Create API Credentials**

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the generated API key

### **Step 3: Configure API Key Restrictions**

1. Click on your API key to edit it
2. Set **Application restrictions** to **HTTP referrers**
3. Add your domain: `https://qmuter-pro.web.app/*`
4. Set **API restrictions** to **Restrict key**
5. Select the APIs you enabled in Step 1

### **Step 4: Enable Billing**

1. Go to **Billing** in Google Cloud Console
2. Link a billing account to your project
3. Google provides $200 free credit monthly

### **Step 5: Set Environment Variable**

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### **Step 6: Deploy the Changes**

```bash
npm run build
firebase deploy --only hosting
```

## 🔍 **Current Status**

- ✅ **Fallback System**: Working with mock Auckland data
- ✅ **Error Handling**: Proper error messages displayed
- ✅ **User Experience**: App continues to work despite API issues
- ❌ **Google Places API**: 404 error due to invalid API key

## 🎯 **Expected Result**

After proper configuration, you should see:
- Real-time address suggestions as you type
- No more "Places API error: 404" messages
- Accurate location data from Google Places
- Better search results with location biasing

## 💰 **Cost Information**

- **Places API**: $17 per 1000 requests
- **Geocoding API**: $5 per 1000 requests
- **Directions API**: $5 per 1000 requests
- **Free Tier**: $200 monthly credit

## 🛠️ **Alternative Solutions**

If you prefer not to use Google Maps API:

1. **Use a different geocoding service** (OpenStreetMap, MapBox)
2. **Implement local address database** for New Zealand
3. **Use AT (Auckland Transport) API** for transport-specific locations

## 📞 **Need Help?**

If you need assistance setting up the Google Maps API:
1. Check the [Google Maps Platform documentation](https://developers.google.com/maps/documentation)
2. Verify your billing is enabled
3. Check API key restrictions and quotas
4. Test the API key in the Google Cloud Console
