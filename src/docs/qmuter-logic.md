# Qmuter: Finalized Route Share Logic

## 1. Route Creation Workflow

| Who can post?    | What happens?                                                 |
| ---------------- | ------------------------------------------------------------- |
| **Drivers**      | Can suggest fixed routes (start, end, schedule, pickup points) |
| **Riders**       | Can vote (like/upvote) on these routes                        |
| **Qmuter Admin** | Can promote popular routes to "official" office routes        |
| **Pre-posted**   | Qmuter team can predefine fixed routes for approval           |

## 2. Fixed Pickup Points Only

- No door-to-door pickups—only approved geo-fenced stops on each route.
- Riders see a map with available stops and select from that list.
- Drivers follow a route and only stop at official locations (like a bus).

## 3. Interaction Logic

| Interaction Type      | How it Works                                            |
| --------------------- | ------------------------------------------------------- |
| **Approval flow**     | Both driver and rider must accept a match on the route  |
| **Messaging**         | Only in-app or web-based (no external contact sharing)  |
| **Confirmation**      | System confirms booking status for both users automatically |
| **Admin override**    | Admin can lock popular routes or disable unpopular ones |

## 4. Seat Management

| Feature               | How It Functions                                |
| --------------------- | ----------------------------------------------- |
| **Total Seats**       | Set by driver when creating the route           |
| **Live Seats Tracker**| Shows: “3 of 6 seats booked” in the UI          |
| **Full Ride Lock**    | Once full, no more booking; marked as “FULL”    |
| **Waitlist (Optional)**| Riders can join a waitlist if the ride is full     |

## 5. Real-Time Map View

Rider and driver both see:
- Live shuttle position
- Route line on the map
- ETA to the pickup point
- Based on Google Maps + Firebase real-time location sharing.

## 6. Security & Automation

- Rider/Driver identity is hidden—only minimal info shown (name + seat).
- Automated confirmations and notifications.
- Use Firebase Cloud Functions to manage:
  - Match approvals
  - Route upvoting
  - Seat count updates
  - Notifications for upcoming trips
