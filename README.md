# Phlows

A river flow dashboard application built with Angular that displays real-time gauge information and 48-hour flow forecasts for Colorado rivers. Users can view rivers from a configuration file, filter by runnable conditions, and analyze flow data with interactive D3 visualizations.

## Features

- **River Dashboard**: View a grid of rivers with current flow status indicators
- **Status Indicators**: Displays whether flow is too low, runnable, or too high
- **Interactive Graph**: 48-hour flow visualization with status bands (too low/runnable/too high)
- **Flow Tooltip**: Hover over data points to see exact flow and timestamp
- **Runnable Filter**: Toggle to show only rivers with runnable flow levels
- **Mobile Responsive**: Fully responsive design for mobile, tablet, and desktop
- **Dark Theme**: Bootstrap dark theme for comfortable viewing
- **Dynamic Scaling**: Graph automatically adjusts to display all flow data with intelligent bounds

## Technology Stack

- **Angular 17.3.0** - Frontend framework (standalone components)
- **Bootstrap 5.3.0** - UI styling with dark theme
- **D3.js 7.8.5** - Interactive graph visualization
- **SASS** - Component styling
- **TypeScript** - Type-safe development

## Getting Started

### Prerequisites

- Node.js and npm installed

### Installation

```bash
npm install
```

## Running the Application

### Development Server

Start the development server:

```bash
npm start
```

or 

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Production Build

Build the project for production:

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Changing the Displayed Rivers

River data is managed through a configuration file that contains all river definitions and their flow ranges.

### River Configuration File

Edit `src/assets/rivers-config.json` to add, modify, or remove rivers:

```json
{
  "rivers": [
    {
      "id": "river-1",
      "name": "South Platte River",
      "location": "Denver, CO",
      "gaugeId": "USGS_SPLATTE",
      "minRange": 1000,
      "maxRange": 3000,
      "runnable": {
        "min": 1500,
        "max": 2500
      },
      "description": "Mountain river flowing through Denver metro area"
    }
  ]
}
```

### Configuration Fields

- **id**: Unique identifier for the river (used in routing)
- **name**: Display name of the river
- **location**: Geographic location
- **gaugeId**: Gauge station identifier (used for future API integration)
- **minRange**: Minimum expected flow in cubic feet per second (cfs)
- **maxRange**: Maximum expected flow in cfs
- **runnable.min**: Minimum safe/enjoyable flow level for activities
- **runnable.max**: Maximum safe flow level
- **description**: Information about the river

### Adding a New River

1. Open `src/assets/rivers-config.json`
2. Add a new object to the `rivers` array with all required fields
3. Save the file
4. The dashboard will automatically load the new river on refresh

### Modifying River Ranges

Update the `minRange`, `maxRange`, and `runnable` values in the configuration file. The graph will automatically adjust its scaling to accommodate the new ranges.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/          # Main river list view
│   │   └── river-detail/       # Detail view with D3 graph
│   ├── services/
│   │   └── river.service.ts    # Data service for rivers
│   ├── app.routes.ts           # Route configuration
│   ├── app.config.ts           # App configuration
│   └── app.component.ts        # Root component
├── assets/
│   └── rivers-config.json      # River data configuration
├── index.html                  # Main HTML file
├── styles.sass                 # Global styles
└── main.ts                     # Application entry point
```

## How It Works

1. **Dashboard**: Loads all rivers from the configuration file and displays them in a responsive grid with current flow status
2. **Status Calculation**: Flow status is determined by comparing current flow against the runnable range
3. **Detail View**: Clicking a river card navigates to the detail page
4. **Graph Generation**: The detail page generates mock 48-hour flow data and visualizes it with D3
5. **Dynamic Bounds**: Graph scaling automatically adjusts based on observed flows with 10% padding
6. **Tooltip Interaction**: Hover (desktop) or tap (mobile) data points to see flow and timestamp details

## Future Enhancements

- Integrate real USGS API data instead of mock data
- Add weather integration for flow forecasting
- Implement flow alerts and notifications
- Add trip planning and booking features
- Export flow data functionality
- Historical flow analysis

## Development Notes

- The application uses standalone Angular components (no NgModules)
- Mock flow data is generated using sine wave patterns for realistic variation
- The D3 graph uses responsive SVG with viewBox for proper scaling
- Bootstrap dark theme is applied globally via `data-bs-theme="dark"`

## Troubleshooting

### Rivers not showing
- Verify `src/assets/rivers-config.json` exists and is valid JSON
- Check browser console for any errors
- Ensure the development server is running

### Graph not displaying correctly
- Check that D3 data has been generated (check browser console)
- Verify viewBox dimensions in the SVG element
- Ensure container has proper width and height

## License

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.16.
