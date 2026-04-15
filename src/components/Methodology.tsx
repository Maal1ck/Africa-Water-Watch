import React from 'react';
import { BookOpen, Satellite, Droplets, Leaf, AlertTriangle } from 'lucide-react';

export default function Methodology() {
  return (
    <div className="p-8 space-y-12 overflow-y-auto h-full bg-app-bg text-app-text">
      <header>
        <h2 className="text-3xl font-bold tracking-tight uppercase">Methodology</h2>
        <p className="text-app-muted text-sm mt-1">Scientific background and computational methods</p>
      </header>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-app-border pb-4">
          <Satellite className="text-app-accent" size={24} />
          <h3 className="text-xl font-bold uppercase tracking-wider">Satellite Data Source</h3>
        </div>
        <div className="prose prose-invert max-w-none">
          <p className="text-app-muted leading-relaxed">
            This application utilizes imagery from the <strong>Copernicus Sentinel-2</strong> mission, operated by the European Space Agency (ESA). Sentinel-2 provides high-resolution multispectral imagery globally, with a revisit time of approximately 5 days. We specifically use the <code>COPERNICUS/S2_SR_HARMONIZED</code> dataset in Google Earth Engine, which provides Surface Reflectance (SR) data that has been atmospherically corrected (Bottom Of Atmosphere - BOA).
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-app-border pb-4">
          <Droplets className="text-blue-500" size={24} />
          <h3 className="text-xl font-bold uppercase tracking-wider">Turbidity (NDTI)</h3>
        </div>
        <div className="prose prose-invert max-w-none space-y-4">
          <p className="text-app-muted leading-relaxed">
            Turbidity is estimated using the <strong>Normalized Difference Turbidity Index (NDTI)</strong>. This index leverages the fact that suspended sediments in water increase the reflectance of red light while absorbing green light.
          </p>
          <div className="bg-[#0b0c0e] p-4 rounded-lg border border-app-border font-mono text-sm inline-block">
            NDTI = (Red - Green) / (Red + Green)<br/>
            NDTI = (Band 4 - Band 3) / (Band 4 + Band 3)
          </div>
          <p className="text-app-muted leading-relaxed">
            <strong>Scaling to NTU:</strong> The raw NDTI value (which ranges from -1 to +1) is empirically scaled to an approximate Nephelometric Turbidity Unit (NTU) for visualization purposes using the formula: <code>((NDTI + 1) * 50)</code>. Note that for rigorous scientific or regulatory use, this index must be calibrated against in-situ physical water samples.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-app-border pb-4">
          <Leaf className="text-green-500" size={24} />
          <h3 className="text-xl font-bold uppercase tracking-wider">Chlorophyll (NDCI)</h3>
        </div>
        <div className="prose prose-invert max-w-none space-y-4">
          <p className="text-app-muted leading-relaxed">
            Chlorophyll-a concentration, an indicator of phytoplankton biomass and potential algal blooms, is estimated using the <strong>Normalized Difference Chlorophyll Index (NDCI)</strong>. This index uses the Red Edge band, which is highly sensitive to chlorophyll reflectance.
          </p>
          <div className="bg-[#0b0c0e] p-4 rounded-lg border border-app-border font-mono text-sm inline-block">
            NDCI = (Red Edge 1 - Red) / (Red Edge 1 + Red)<br/>
            NDCI = (Band 5 - Band 4) / (Band 5 + Band 4)
          </div>
          <p className="text-app-muted leading-relaxed">
            <strong>Scaling:</strong> Similar to turbidity, the raw NDCI value is scaled to a 0-100 index to provide a relative measure of chlorophyll concentration, categorized into Low, Moderate, and High statuses.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-app-border pb-4">
          <AlertTriangle className="text-amber-500" size={24} />
          <h3 className="text-xl font-bold uppercase tracking-wider">Limitations & Considerations</h3>
        </div>
        <div className="prose prose-invert max-w-none">
          <ul className="list-disc list-inside space-y-2 text-app-muted leading-relaxed">
            <li><strong>Cloud Cover:</strong> Optical satellites cannot see through clouds. The application filters out images where the overall scene cloud cover exceeds the user-defined threshold, but localized cloud shadows or thin cirrus clouds may still affect individual pixel readings.</li>
            <li><strong>Optical Depth:</strong> Satellite sensors only measure the surface layer of the water body (typically the top few meters, depending on water clarity). They do not provide information about the water column at depth.</li>
            <li><strong>Bottom Reflectance:</strong> In very shallow, clear water, the satellite may "see" the bottom (sand, rocks, submerged vegetation), which can artificially inflate the turbidity or chlorophyll readings.</li>
            <li><strong>Atmospheric Interference:</strong> While Surface Reflectance data is used, residual atmospheric effects (like haze or smoke) can occasionally impact the indices.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
