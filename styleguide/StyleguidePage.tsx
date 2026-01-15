import React, { useState } from 'react';
import { StyleguideLayout } from './StyleguideLayout';
import { cn } from '../lib/utils';
import { Check, AlertCircle, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StyleguidePageProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onClose: () => void;
}

// Color Swatch Component
const ColorSwatch: React.FC<{ name: string; variable: string; className?: string }> = ({
  name,
  variable,
  className
}) => (
  <div className="flex flex-col gap-2">
    <div
      className={cn("w-full h-16 rounded-lg border border-border", className)}
      style={{ backgroundColor: `var(${variable})` }}
    />
    <div>
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground font-mono">{variable}</p>
    </div>
  </div>
);

// Section Header Component
const SectionHeader: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-foreground">{title}</h2>
    {description && <p className="text-muted-foreground mt-1">{description}</p>}
  </div>
);

// Subsection Header Component
const SubsectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
);

export const StyleguidePage: React.FC<StyleguidePageProps> = ({
  isDark,
  onToggleTheme,
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState('tokens');

  const renderTokensSection = () => (
    <div className="space-y-12">
      <SectionHeader
        title="Design Tokens"
        description="Foundation variables that define the visual language of the design system."
      />

      {/* Base Colors */}
      <div>
        <SubsectionHeader title="Base Colors" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorSwatch name="Background" variable="--background" />
          <ColorSwatch name="Foreground" variable="--foreground" />
          <ColorSwatch name="Card" variable="--card" />
          <ColorSwatch name="Card Foreground" variable="--card-foreground" />
        </div>
      </div>

      {/* Primary Scale */}
      <div>
        <SubsectionHeader title="Primary Scale" />
        <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
          {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].map((shade) => (
            <div key={shade} className="flex flex-col gap-1">
              <div
                className="w-full h-12 rounded-md border border-border"
                style={{ backgroundColor: `var(--primary-${shade})` }}
              />
              <p className="text-xs text-muted-foreground text-center">{shade}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grey Scale */}
      <div>
        <SubsectionHeader title="Grey Scale" />
        <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
          {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].map((shade) => (
            <div key={shade} className="flex flex-col gap-1">
              <div
                className="w-full h-12 rounded-md border border-border"
                style={{ backgroundColor: `var(--grey-${shade})` }}
              />
              <p className="text-xs text-muted-foreground text-center">{shade}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Semantic Colors */}
      <div>
        <SubsectionHeader title="Semantic Colors" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorSwatch name="Primary" variable="--primary" />
          <ColorSwatch name="Secondary" variable="--secondary" />
          <ColorSwatch name="Muted" variable="--muted" />
          <ColorSwatch name="Accent" variable="--accent" />
          <ColorSwatch name="Destructive" variable="--destructive" />
          <ColorSwatch name="Success" variable="--success" />
          <ColorSwatch name="Warning" variable="--warning" />
          <ColorSwatch name="Info" variable="--info" />
        </div>
      </div>

      {/* Border & Input */}
      <div>
        <SubsectionHeader title="Border & Input" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorSwatch name="Border" variable="--border" />
          <ColorSwatch name="Input" variable="--input" />
          <ColorSwatch name="Ring" variable="--ring" />
        </div>
      </div>

      {/* Chart Colors */}
      <div>
        <SubsectionHeader title="Chart Colors" />
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((num) => (
            <ColorSwatch key={num} name={`Chart ${num}`} variable={`--chart-${num}`} />
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <SubsectionHeader title="Border Radius" />
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-primary rounded-sm" />
            <p className="text-xs text-muted-foreground">sm</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-primary rounded-md" />
            <p className="text-xs text-muted-foreground">md</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-primary rounded-lg" />
            <p className="text-xs text-muted-foreground">lg</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-primary rounded-xl" />
            <p className="text-xs text-muted-foreground">xl</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-primary rounded-full" />
            <p className="text-xs text-muted-foreground">full</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderColorsSection = () => (
    <div className="space-y-12">
      <SectionHeader
        title="Color Palette"
        description="Complete color system with semantic meaning and accessibility in mind."
      />

      {/* Primary */}
      <div>
        <SubsectionHeader title="Primary (Golden Yellow - #FFB900)" />
        <p className="text-sm text-muted-foreground mb-4">
          The primary brand color used for main actions, emphasis, and brand identity.
        </p>
        <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
          {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].map((shade) => (
            <div key={shade} className="flex flex-col gap-1">
              <div
                className="w-full h-16 rounded-md border border-border"
                style={{ backgroundColor: `var(--primary-${shade})` }}
              />
              <p className="text-xs text-muted-foreground text-center font-mono">{shade}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grey */}
      <div>
        <SubsectionHeader title="Grey (Neutral)" />
        <p className="text-sm text-muted-foreground mb-4">
          Neutral grey scale used for text, backgrounds, and borders.
        </p>
        <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
          {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].map((shade) => (
            <div key={shade} className="flex flex-col gap-1">
              <div
                className="w-full h-16 rounded-md border border-border"
                style={{ backgroundColor: `var(--grey-${shade})` }}
              />
              <p className="text-xs text-muted-foreground text-center font-mono">{shade}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status Colors */}
      <div>
        <SubsectionHeader title="Status Colors" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="w-full h-24 rounded-lg bg-success mb-2" />
            <p className="font-medium text-foreground">Success</p>
            <p className="text-xs text-muted-foreground font-mono">--success</p>
          </div>
          <div>
            <div className="w-full h-24 rounded-lg bg-warning mb-2" />
            <p className="font-medium text-foreground">Warning</p>
            <p className="text-xs text-muted-foreground font-mono">--warning</p>
          </div>
          <div>
            <div className="w-full h-24 rounded-lg bg-destructive mb-2" />
            <p className="font-medium text-foreground">Destructive</p>
            <p className="text-xs text-muted-foreground font-mono">--destructive</p>
          </div>
          <div>
            <div className="w-full h-24 rounded-lg bg-info mb-2" />
            <p className="font-medium text-foreground">Info</p>
            <p className="text-xs text-muted-foreground font-mono">--info</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTypographySection = () => (
    <div className="space-y-12">
      <SectionHeader
        title="Typography"
        description="Inter font family with carefully crafted type scale."
      />

      {/* Font Family */}
      <div>
        <SubsectionHeader title="Font Family" />
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-4xl font-bold mb-2">Inter</p>
          <p className="text-muted-foreground">
            A carefully crafted open-source typeface designed for screen.
          </p>
          <p className="text-sm text-muted-foreground mt-2 font-mono">
            font-family: "Inter", sans-serif;
          </p>
        </div>
      </div>

      {/* Headings */}
      <div>
        <SubsectionHeader title="Headings" />
        <div className="space-y-6">
          <div className="border-b border-border pb-4">
            <h1 className="text-5xl font-bold">Heading 1</h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">text-5xl font-bold</p>
          </div>
          <div className="border-b border-border pb-4">
            <h2 className="text-4xl font-bold">Heading 2</h2>
            <p className="text-sm text-muted-foreground mt-1 font-mono">text-4xl font-bold</p>
          </div>
          <div className="border-b border-border pb-4">
            <h3 className="text-3xl font-bold">Heading 3</h3>
            <p className="text-sm text-muted-foreground mt-1 font-mono">text-3xl font-bold</p>
          </div>
          <div className="border-b border-border pb-4">
            <h4 className="text-2xl font-semibold">Heading 4</h4>
            <p className="text-sm text-muted-foreground mt-1 font-mono">text-2xl font-semibold</p>
          </div>
          <div className="border-b border-border pb-4">
            <h5 className="text-xl font-semibold">Heading 5</h5>
            <p className="text-sm text-muted-foreground mt-1 font-mono">text-xl font-semibold</p>
          </div>
          <div>
            <h6 className="text-lg font-semibold">Heading 6</h6>
            <p className="text-sm text-muted-foreground mt-1 font-mono">text-lg font-semibold</p>
          </div>
        </div>
      </div>

      {/* Body Text */}
      <div>
        <SubsectionHeader title="Body Text" />
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-lg">Large body text for important content and lead paragraphs.</p>
            <p className="text-sm text-muted-foreground mt-2 font-mono">text-lg</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-base">Default body text for general content. This is the standard text size used throughout the application for readability and consistency.</p>
            <p className="text-sm text-muted-foreground mt-2 font-mono">text-base (16px)</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm">Small body text for secondary information and supporting content.</p>
            <p className="text-sm text-muted-foreground mt-2 font-mono">text-sm (14px)</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-xs">Extra small text for captions, labels, and metadata.</p>
            <p className="text-sm text-muted-foreground mt-2 font-mono">text-xs (12px)</p>
          </div>
        </div>
      </div>

      {/* Font Weights */}
      <div>
        <SubsectionHeader title="Font Weights" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xl font-light">Light</p>
            <p className="text-xs text-muted-foreground font-mono">300</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xl font-normal">Regular</p>
            <p className="text-xs text-muted-foreground font-mono">400</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xl font-medium">Medium</p>
            <p className="text-xs text-muted-foreground font-mono">500</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xl font-semibold">Semibold</p>
            <p className="text-xs text-muted-foreground font-mono">600</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xl font-bold">Bold</p>
            <p className="text-xs text-muted-foreground font-mono">700</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderButtonsSection = () => (
    <div className="space-y-12">
      <SectionHeader
        title="Buttons"
        description="Interactive button components for actions and navigation."
      />

      {/* Variants */}
      <div>
        <SubsectionHeader title="Variants" />
        <div className="flex flex-wrap gap-4">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:brightness-105 transition-all">
            Primary
          </button>
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:bg-secondary/80 transition-colors">
            Secondary
          </button>
          <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium hover:bg-destructive/90 transition-colors">
            Destructive
          </button>
          <button className="border border-input bg-background text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
            Outline
          </button>
          <button className="text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
            Ghost
          </button>
          <button className="text-primary underline-offset-4 hover:underline px-4 py-2 font-medium">
            Link
          </button>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <SubsectionHeader title="Sizes" />
        <div className="flex flex-wrap items-center gap-4">
          <button className="bg-primary text-primary-foreground px-3 py-1.5 text-xs rounded-md font-medium hover:brightness-105 transition-all">
            Small
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2 text-sm rounded-lg font-medium hover:brightness-105 transition-all">
            Default
          </button>
          <button className="bg-primary text-primary-foreground px-6 py-3 text-base rounded-lg font-medium hover:brightness-105 transition-all">
            Large
          </button>
        </div>
      </div>

      {/* States */}
      <div>
        <SubsectionHeader title="States" />
        <div className="flex flex-wrap gap-4">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium">
            Default
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium brightness-105">
            Hover
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium ring-2 ring-ring ring-offset-2 ring-offset-background">
            Focus
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium opacity-50 cursor-not-allowed" disabled>
            Disabled
          </button>
        </div>
      </div>

      {/* With Icons */}
      <div>
        <SubsectionHeader title="With Icons" />
        <div className="flex flex-wrap gap-4">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:brightness-105 transition-all flex items-center gap-2">
            <Check size={16} />
            With Icon Left
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:brightness-105 transition-all flex items-center gap-2">
            With Icon Right
            <Check size={16} />
          </button>
          <button className="bg-primary text-primary-foreground p-2 rounded-lg font-medium hover:brightness-105 transition-all">
            <Check size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderCardsSection = () => (
    <div className="space-y-12">
      <SectionHeader
        title="Cards"
        description="Container components for grouping related content."
      />

      {/* Basic Card */}
      <div>
        <SubsectionHeader title="Basic Card" />
        <div className="max-w-md">
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
            <h3 className="font-bold text-lg mb-2">Card Title</h3>
            <p className="text-muted-foreground text-sm">
              This is a basic card component with a title and description. Cards are used to group related content together.
            </p>
          </div>
        </div>
      </div>

      {/* Card with Header */}
      <div>
        <SubsectionHeader title="Card with Header" />
        <div className="max-w-md">
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="font-bold">Card Header</h3>
              <p className="text-sm text-muted-foreground">Card description goes here</p>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                Card content area with padding. This is where the main content of the card would go.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card with Footer */}
      <div>
        <SubsectionHeader title="Card with Footer" />
        <div className="max-w-md">
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2">Card Title</h3>
              <p className="text-muted-foreground text-sm">
                Card content with a footer section below for actions.
              </p>
            </div>
            <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-2">
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button className="bg-primary text-primary-foreground px-4 py-2 text-sm rounded-lg font-medium hover:brightness-105 transition-all">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Card */}
      <div>
        <SubsectionHeader title="Interactive Card" />
        <div className="max-w-md">
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all">
            <h3 className="font-bold text-lg mb-2">Clickable Card</h3>
            <p className="text-muted-foreground text-sm">
              This card has hover effects and appears clickable. Hover to see the border and shadow change.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBadgesSection = () => (
    <div className="space-y-12">
      <SectionHeader
        title="Badges"
        description="Small labels for status, categories, or counts."
      />

      {/* Variants */}
      <div>
        <SubsectionHeader title="Variants" />
        <div className="flex flex-wrap gap-3">
          <span className="bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full text-xs font-semibold">
            Primary
          </span>
          <span className="bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full text-xs font-semibold">
            Secondary
          </span>
          <span className="bg-destructive text-destructive-foreground px-2.5 py-0.5 rounded-full text-xs font-semibold">
            Destructive
          </span>
          <span className="border border-input px-2.5 py-0.5 rounded-full text-xs font-semibold">
            Outline
          </span>
        </div>
      </div>

      {/* Status Badges */}
      <div>
        <SubsectionHeader title="Status Badges" />
        <div className="flex flex-wrap gap-3">
          <span className="bg-success/15 text-success px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} />
            Success
          </span>
          <span className="bg-warning/15 text-warning px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <AlertTriangle size={12} />
            Warning
          </span>
          <span className="bg-destructive/15 text-destructive px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <AlertCircle size={12} />
            Error
          </span>
          <span className="bg-info/15 text-info px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <Info size={12} />
            Info
          </span>
        </div>
      </div>

      {/* Priority Badges */}
      <div>
        <SubsectionHeader title="Priority Badges (App Example)" />
        <div className="flex flex-wrap gap-3">
          <span className="bg-slate-500/15 text-slate-700 dark:text-slate-400 px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wide">
            Baixa
          </span>
          <span className="bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wide">
            Média
          </span>
          <span className="bg-red-500/15 text-red-700 dark:text-red-400 px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wide">
            Alta
          </span>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <SubsectionHeader title="Sizes" />
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-[10px] font-bold">
            XS
          </span>
          <span className="bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full text-xs font-semibold">
            Small
          </span>
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
            Default
          </span>
        </div>
      </div>
    </div>
  );

  const renderAlertsSection = () => (
    <div className="space-y-12">
      <SectionHeader
        title="Alerts"
        description="Informational messages and notifications."
      />

      {/* Default Alert */}
      <div>
        <SubsectionHeader title="Default" />
        <div className="max-w-2xl">
          <div className="border border-border rounded-lg p-4 flex gap-3">
            <Info size={20} className="text-foreground shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground">Heads up!</h4>
              <p className="text-sm text-muted-foreground">
                You can add components to your app using the CLI.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      <div>
        <SubsectionHeader title="Success" />
        <div className="max-w-2xl">
          <div className="border border-success/30 bg-success/10 rounded-lg p-4 flex gap-3">
            <CheckCircle2 size={20} className="text-success shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-success">Success!</h4>
              <p className="text-sm text-success/80">
                Your changes have been saved successfully.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Alert */}
      <div>
        <SubsectionHeader title="Warning" />
        <div className="max-w-2xl">
          <div className="border border-warning/30 bg-warning/10 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-warning">Warning</h4>
              <p className="text-sm text-warning/80">
                Your session is about to expire. Please save your work.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      <div>
        <SubsectionHeader title="Error" />
        <div className="max-w-2xl">
          <div className="border border-destructive/30 bg-destructive/10 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-destructive">Error</h4>
              <p className="text-sm text-destructive/80">
                Something went wrong. Please try again later.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div>
        <SubsectionHeader title="Info" />
        <div className="max-w-2xl">
          <div className="border border-info/30 bg-info/10 rounded-lg p-4 flex gap-3">
            <Info size={20} className="text-info shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-info">Did you know?</h4>
              <p className="text-sm text-info/80">
                You can customize the theme in settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInputsSection = () => (
    <div className="space-y-12">
      <SectionHeader
        title="Inputs"
        description="Form input components for user data entry."
      />

      {/* Text Input */}
      <div>
        <SubsectionHeader title="Text Input" />
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Default</label>
            <input
              type="text"
              placeholder="Enter text..."
              className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Disabled</label>
            <input
              type="text"
              placeholder="Disabled input"
              disabled
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-muted-foreground placeholder:text-muted-foreground cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">With Error</label>
            <input
              type="text"
              placeholder="Invalid input"
              className="w-full px-4 py-2 bg-background border border-destructive rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
            />
            <p className="text-xs text-destructive mt-1">This field is required.</p>
          </div>
        </div>
      </div>

      {/* Textarea */}
      <div>
        <SubsectionHeader title="Textarea" />
        <div className="max-w-md">
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            placeholder="Enter description..."
            rows={4}
            className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      </div>

      {/* Checkbox */}
      <div>
        <SubsectionHeader title="Checkbox (Round - App Style)" />
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="w-5 h-5 rounded-full border-2 border-input flex items-center justify-center hover:border-primary transition-colors">
            </div>
            <span className="text-sm text-foreground">Unchecked</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
              <Check size={12} strokeWidth={3} className="text-primary-foreground" />
            </div>
            <span className="text-sm text-foreground line-through text-muted-foreground">Checked</span>
          </label>
        </div>
      </div>

      {/* Select */}
      <div>
        <SubsectionHeader title="Select" />
        <div className="max-w-md">
          <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
          <select className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select priority...</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'tokens':
        return renderTokensSection();
      case 'colors':
        return renderColorsSection();
      case 'typography':
        return renderTypographySection();
      case 'buttons':
        return renderButtonsSection();
      case 'cards':
        return renderCardsSection();
      case 'badges':
        return renderBadgesSection();
      case 'alerts':
        return renderAlertsSection();
      case 'inputs':
        return renderInputsSection();
      default:
        return renderTokensSection();
    }
  };

  return (
    <StyleguideLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      onClose={onClose}
    >
      {renderContent()}
    </StyleguideLayout>
  );
};
