# **App Name**: Qmuter

## Core Features:

- Authentication: Allow users to securely log in/sign up via email or Google using Firebase Authentication.
- User Role Selection: Enable users to toggle between "Driver" and "Passenger" roles to customize their experience.
- Commute Posting: Enable drivers to create a commute post with origin, destination, commute time, and number of available seats. Passengers can also post the origin, destination and preferred commute time.
- Ride Matching: Allow users to find ride matches based on proximity and time windows, using Google Maps integration.
- Filtering and Sorting: Filter available rides based on earliest departure or best route match using data derived from the Google Maps API.
- Route Similarity: Implement an AI tool using a Large Language Model that evaluates commute similarity by cross-referencing origin and destination data.
- Rating System: Allow users to rate their commute match using a simple thumbs-up or star rating system, stored in Firestore.

## Style Guidelines:

- Primary color: Use a calming blue (#5DADE2) to evoke trust and reliability for commuters.
- Background color: Light gray (#F0F4F7), providing a neutral backdrop that emphasizes content and reduces eye strain during commutes.
- Accent color: Vibrant orange (#F39C12) to highlight interactive elements and calls to action.
- Body and headline font: 'Inter', a sans-serif, will provide a clean and modern appearance.
- Employ recognizable icons for navigation, commute details, and user actions; focus on simplicity.
- Mobile-first layout with intuitive design, prioritizing key information for on-the-go access and easy readability.
- Smooth transitions and loading animations to enhance user experience without being distracting during quick interactions.