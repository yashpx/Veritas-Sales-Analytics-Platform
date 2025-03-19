# Veritas Calendar

A modern, feature-rich calendar application for the Veritas project.

## Features

- Week and month views
- Event creation, editing, and deletion
- Event categorization by type
- Drag and drop event scheduling
- Notifications and reminders
- Persistent storage via localStorage or Supabase

## Supabase Integration

The calendar can be integrated with Supabase for persistent storage across devices and users.

### Setting Up Supabase

1. Create a new table in your Supabase project using the SQL in `calendar_events_table.sql`
2. Get your Supabase URL and anon key from your Supabase project settings
3. Update the `data-supabase-key` attribute in `calendar.html` with your anon key
4. Make sure the `supabaseEnabled` option is set to `true` when initializing the calendar

### Configuration Options

```javascript
const calendar = new VeritasSalesCalendar('calendar-container', {
    supabaseEnabled: true,               // Enable Supabase integration
    supabaseTable: 'calendar_events',    // Name of your Supabase table
    // Other options...
});
```

## Usage

1. Open `calendar.html` in a web browser
2. Click on a time slot to create a new event
3. Click on an existing event to view or edit its details
4. Use the week/month buttons to switch between views
5. Use the prev/next buttons to navigate between weeks/months

## Event Types

The calendar supports the following event types by default:

- Follow-up Call
- Client Meeting
- Product Demo
- Training Session
- Other

Each event type has a distinct color for easy visual identification.

## Local Storage

If Supabase integration is not enabled, the calendar will fall back to using localStorage for event persistence. This means events will be stored in the browser and will persist between page refreshes, but will not be synchronized across different devices or browsers.

## Browser Notifications

The calendar supports browser notifications for event reminders. Users will be prompted to allow notifications when they first use the calendar.
