# Phlows - River Flow Dashboard

A real-time river flow dashboard built with Angular that displays current flow data from USGS monitoring stations. Get up-to-date information on river conditions for paddling, fishing, and outdoor recreation.

## Features

✨ **Real-Time Flow Data** - Integrates with USGS Water Data OGC API for current flow readings
📊 **48-Hour Flow Graphs** - Interactive D3.js charts showing flow trends with color-coded zones
🎨 **Status Indicators** - Visual feedback showing if rivers are too low, runnable, or too high
💾 **Smart Caching** - 5-minute cache TTL reduces API calls and improves performance
📱 **Responsive Design** - Bootstrap 5 dark theme works on desktop and mobile
🌐 **SPA Routing** - Fast navigation between dashboard and river detail views

## Tech Stack

- **Framework**: Angular 17 (standalone components)
- **Styling**: Bootstrap 5.3.0 with SASS
- **Visualization**: D3.js 7.8.5
- **HTTP**: Angular HttpClient with RxJS
- **Data Source**: USGS Water Data OGC API
- **Deployment**: Azure Static Web Apps

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/          # Main river list view
│   │   └── river-detail/       # Individual river 48-hour graph
│   ├── services/
│   │   └── river.service.ts    # USGS API integration & caching
│   ├── app.component.*         # Root component
│   ├── app.config.ts           # DI configuration
│   └── app.routes.ts           # Route definitions
├── assets/
│   └── rivers-config.json      # River configuration (gauge IDs, ranges)
├── index.html                  # Main HTML with Bootstrap CDN
└── styles.sass                 # Global styles
```

## Configuration

Rivers are configured in `src/assets/rivers-config.json`. Each river entry includes:

```json
{
  "id": "usgs_14238050",
  "name": "East Fork Lewis (EFL)",
  "location": "Heisson, WA",
  "gaugeId": "14238050",
  "runnable": { "min": 400, "max": 1800 },
  "description": "Classic Northwest whitewater with iconic waterfalls and technical rapids"
}
```

**Adding New Rivers:**
1. Get the USGS gauge ID from [USGS Water Data](https://waterdata.usgs.gov)
2. Add entry to `rivers-config.json`
3. Specify the runnable flow range (min-max cfs) based on the river's characteristics

## Getting Started

### Prerequisites
- Node.js 20+ (supports Node.js LTS versions)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/knu2xs/phlows.git
cd phlows

# Install dependencies
npm ci

# Start development server
npm start
```

The app will be available at `http://localhost:4200/`

**Note:** The local dev server uses `base href="/"`, so assets load from the root path.

## Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build:prod

# Run tests
npm test

# Watch mode (continuous build)
npm run watch
```

## Deployment

### Azure Static Web Apps (Recommended)

Azure Static Web Apps is the recommended hosting solution. It provides:
- ✅ Automatic SPA routing
- ✅ No CSP restrictions
- ✅ Automatic HTTPS
- ✅ Free tier available
- ✅ CI/CD via GitHub Actions

**Setup Steps:**

1. **Create Azure Static Web App:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Create "Static Web App" resource
   - Connect your GitHub repository
   - Select branch: `main`
   - Build preset: Angular
   - Azure will generate an API token

2. **Add GitHub Secret:**
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Create new secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Paste the token from Azure

3. **Deploy:**
   - Push to `main` branch
   - GitHub Actions workflow automatically builds and deploys
   - Access at your Azure Static Web Apps URL

**Configuration Files:**
- `.github/workflows/azure-static-web-apps.yml` - CI/CD pipeline
- `staticwebapp.config.json` - SPA routing and configuration

### Local Testing

To test the production build locally with the correct base href:

```bash
# Build for production
npm run build:prod

# Serve from dist folder
npx http-server dist/phlows/browser -c-1 --spa
```

Then visit `http://localhost:8080/phlows/`

## Key Updates & Fixes

### Version 1.0

**Features:**
- Real-time USGS API integration with flow caching
- 48-hour flow trend visualization with D3.js
- Color-coded flow zones (red=too low, green=runnable, yellow=too high)
- Responsive card-based dashboard
- River detail view with interactive graph
- Progress bars with status-based coloring
- River cards sorted by flow percentage (highest to lowest)

**Fixes:**
- ✅ Fixed base href for Azure Static Web Apps deployment (`/phlows/`)
- ✅ Fixed asset paths for both dev and production
- ✅ Added CSP-compliant SPA routing via staticwebapp.config.json
- ✅ Implemented responsive chart resizing on window resize
- ✅ Added comma formatting to all numeric displays
- ✅ Sorted river cards by flow percentage (highest to lowest)
- ✅ Color-coded progress bars matching status indicators
- ✅ Removed GitHub Pages deployment in favor of Azure Static Web Apps
- ✅ Updated Angular build output structure for Angular 17 (`dist/phlows/browser/`)

**Configuration:**
- Base href: `/phlows/` (set in index.html for Azure deployment)
- Asset path: `assets/rivers-config.json` (relative for both dev and prod)
- Cache TTL: 5 minutes for USGS flow data
- Build output: `dist/phlows/browser/` (Angular 17 format)

## USGS API Integration

The app fetches real-time streamflow data from the USGS Water Data OGC API:

**Endpoint:** `https://api.waterdata.usgs.gov/ogcapi/v0/collections/continuous/items`

**Query Parameters:**
- `monitoring_location_id`: USGS_{gaugeId}
- `parameter_code`: 00060 (discharge in cfs)
- `time`: PT48H (last 48 hours)
- `limit`: 500 (max records)

**Caching Strategy:**
1. Check 5-minute cache
2. If valid, return cached data
3. If expired, fetch from API
4. On API failure, return stale cache (graceful degradation)
5. If no cache available, return empty array and show "No Data" status

## Configured Rivers

Currently configured rivers:
- **East Fork Lewis (EFL)** - Heisson, WA (Gauge: 14238050) - 400-1,800 cfs
- **Tilton** - Cinebar, WA (Gauge: 14236200) - 400-4,000 cfs
- **Canyon Creek of the Lewis** - Heisson, WA (Gauge: 14237500) - 800-2,500 cfs
- **Cedar River** - Landsburg, WA (Gauge: 12117600) - 200-1,200 cfs

All flow ranges are in cubic feet per second (cfs).

## Architecture

### Component Hierarchy
```
AppComponent (router-outlet)
├── DashboardComponent
│   └── River cards (sorted by flow percentage)
└── RiverDetailComponent
    ├── Current status display
    ├── River information
    ├── Flow range legend
    └── D3.js graph (48-hour trend)
```

### Data Flow
```
RiverService
├── getRivers() → assets/rivers-config.json
├── getFlowData() → USGS API + Cache
└── getStageStatus() → Status calculation

Components
├── Dashboard → displays all rivers
└── RiverDetail → displays single river graph
```

## Responsive Design

- **Mobile**: Single column layout, stacked cards
- **Tablet**: 2-column layout
- **Desktop**: 3-column layout

All charts automatically resize when the browser window is resized.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Bundle Size: ~127 KB (gzipped)
- Initial Load: < 2 seconds
- Chart Rendering: < 1 second
- API Cache: 5 minutes TTL (configurable)

## Troubleshooting

### Styles and Scripts Not Loading in Development
The dev server uses `base href="/"` so all assets load from the root. If you see a black page or missing styles:
- Make sure you're accessing `http://localhost:4200/` (not a subpath)
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

### Production Deployment Issues
The production build uses `base href="/phlows/"` for Azure Static Web Apps. This is set automatically by the Angular build configuration and cannot be overridden by the dev server.

### USGS API Unavailable
If the USGS API is down:
- The app shows "No Data" status
- Previously cached data (within 5 min) is used as fallback
- After 5 minutes without update, shows "No Data"

## Future Enhancements

- Historical data analysis and trending
- Multi-gauge comparison charts
- Weather integration
- Flow alerts/notifications
- Trip planning recommendations
- User preferences and favorites

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Links

- **Repository**: https://github.com/knu2xs/phlows
- **USGS Water Data**: https://waterdata.usgs.gov
- **American Whitewater**: https://www.americanwhitewater.org

## Support

For issues, feature requests, or questions, please open an [Issue](https://github.com/knu2xs/phlows/issues) on GitHub.

---

Built with ❤️ for river enthusiasts. Get out there and paddle!
