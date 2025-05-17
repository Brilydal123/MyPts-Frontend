import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Profile } from '@/models/Profile';

/**
 * GET /api/analytics/login-activity/[profileId]
 * Retrieves login activity data for a profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { profileId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;

    // Connect to database
    await connectToDatabase();

    // Find profile and verify ownership
    const profile = await Profile.findById(params.profileId).select('userId');

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found' },
        { status: 404 }
      );
    }

    // Verify user is requesting their own data or is an admin
    if (profile.userId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Find user and select sessions
    const user = await User.findById(profile.userId).select('sessions lastLogin');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Process sessions data to get login activity
    const sessions = user.sessions || [];
    
    // Create a map of dates with login counts
    const loginsByDate = new Map<string, number>();
    
    // Initialize all dates in the range with 0 logins
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(endDate.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      loginsByDate.set(dateStr, 0);
    }
    
    // Count logins by date
    sessions.forEach((session: any) => {
      const sessionDate = new Date(session.createdAt);
      
      // Only include sessions within the date range
      if (sessionDate >= startDate && sessionDate <= endDate) {
        const dateStr = sessionDate.toISOString().split('T')[0];
        const currentCount = loginsByDate.get(dateStr) || 0;
        loginsByDate.set(dateStr, currentCount + 1);
      }
    });
    
    // Convert to array format for response
    const loginActivity = Array.from(loginsByDate.entries())
      .map(([date, logins]) => ({ date, logins }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date ascending
    
    // Calculate trend
    const totalLogins = loginActivity.reduce((sum, day) => sum + day.logins, 0);
    const averageLogins = totalLogins / days;
    
    // Calculate trend by comparing recent days to overall average
    const recentDays = 7; // Last week
    const recentActivity = loginActivity.slice(-recentDays);
    const recentLogins = recentActivity.reduce((sum, day) => sum + day.logins, 0);
    const recentAverage = recentLogins / recentDays;
    
    const trendPercentage = averageLogins > 0 
      ? ((recentAverage - averageLogins) / averageLogins) * 100 
      : 0;
    
    const trend = {
      percentage: Math.abs(parseFloat(trendPercentage.toFixed(1))),
      isUp: trendPercentage >= 0
    };

    return NextResponse.json({
      success: true,
      data: {
        loginActivity,
        trend,
        totalLogins,
        averageLogins: parseFloat(averageLogins.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error fetching login activity:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
