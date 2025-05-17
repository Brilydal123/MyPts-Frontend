# MyPts Analytics Components

This directory contains components for displaying MyPts analytics data using Shadcn charts.

## Components

### MyPtsAnalytics

The main component that displays all MyPts analytics charts. It automatically retrieves the profile ID from the URL parameters or localStorage.

```tsx
import { MyPtsAnalytics } from "@/components/analytics/MyPtsAnalytics"

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8">
      <MyPtsAnalytics />
    </div>
  )
}
```

### Individual Chart Components

You can also use the individual chart components directly:

#### LoginActivityChart

Displays login activity over time.

```tsx
import { LoginActivityChart } from "@/components/ui/LineChartLabel"

<LoginActivityChart profileId={profileId} />
```

#### MyPtsBalanceChart

Displays MyPts balance history.

```tsx
import { MyPtsBalanceChart } from "@/components/ui/AreaChartStacked"

<MyPtsBalanceChart profileId={profileId} />
```

#### TransactionDistributionChart

Displays the distribution of MyPts transactions (earned vs spent).

```tsx
import { TransactionDistributionChart } from "@/components/ui/BarChartNegative"

<TransactionDistributionChart profileId={profileId} />
```

## API Requirements

These components expect the following API endpoints to be available:

- `/api/analytics/dashboard/${profileId}/usage` - For login activity data
- `/api/analytics/dashboard/${profileId}/mypts` - For MyPts balance and transaction data

## Data Structure

The components expect the following data structure from the API:

### Usage Data

```json
{
  "success": true,
  "data": {
    "activityHistory": [
      {
        "date": "2023-06-01T12:00:00Z",
        "activityType": "login",
        "pointsEarned": 10
      }
    ],
    "loginStamps": 42
  }
}
```

### MyPts Data

```json
{
  "success": true,
  "data": {
    "currentBalance": 5000,
    "lifetimeEarned": 10000,
    "lifetimeSpent": 5000,
    "transactions": [
      {
        "date": "2023-06-01T12:00:00Z",
        "amount": 100,
        "type": "BUY_MYPTS"
      },
      {
        "date": "2023-06-02T12:00:00Z",
        "amount": 50,
        "type": "SPEND_MYPTS"
      }
    ]
  }
}
```

## Styling

The charts use the following CSS variables for colors:

- `--chart-1`: Primary chart color
- `--chart-2`: Secondary chart color

You can customize these in your global CSS.
