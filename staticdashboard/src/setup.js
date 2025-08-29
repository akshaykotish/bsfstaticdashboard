// createStructure.js
const fs = require("fs");
const path = require("path");

// Define structure
const structure = {
  "Engineering": {
    "index.js": "",
    "components": {
      "Header.js": "",
      "AdvancedFilters.js": "",
      "MetricsCards.js": "",
      "ChartNavigation.js": "",
      "DashboardContent.js": "",
      "InsightsPanel.js": "",
      "charts": {
        "OverviewCharts.js": ""
      },
      "modals": {
        "ExportModal.js": ""
      }
    },
    "utils": {
      "dataLoader.js": "",
      "metricsCalculator.js": "",
      "dataFilters.js": ""
    },
    "constants": {
      "chartConfig.js": ""
    }
  }
};

// Recursive function to build structure
function createStructure(basePath, obj) {
  for (const name in obj) {
    const targetPath = path.join(basePath, name);

    if (typeof obj[name] === "string") {
      // Create file
      fs.writeFileSync(targetPath, obj[name]);
      console.log("Created file:", targetPath);
    } else {
      // Create folder
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
        console.log("Created folder:", targetPath);
      }
      createStructure(targetPath, obj[name]);
    }
  }
}

// Run creation
createStructure(".", structure);
