# Craft.js Page Builder Integration Plan

## Goal
Replace the simple TipTap inline editor with a **Craft.js visual page builder** that allows drag-and-drop editing of page sections for the About page and Blog posts.

## Scope
- **In Scope**: About page, Blog posts
- **Out of Scope**: Homepage (keep as-is)

## Architecture Changes

### 1. Data Model Update
Currently, pages store content as HTML strings. We need to support both:
- **Legacy HTML** (for existing content)
- **Craft.js JSON** (for new page builder content)

**Schema Change:**
```prisma
model Page {
  // ... existing fields
  content     String   @db.Text  // Keep for backward compatibility
  builderData String?  @db.Text  // New: JSON from Craft.js
  editorType  String   @default("html") // "html" or "builder"
}

model Blog {
  // ... existing fields
  content     String   @db.Text
  builderData String?  @db.Text
  editorType  String   @default("html")
}
```

### 2. Component Architecture

#### Pre-built Components
Create reusable Craft.js components:
- **Text Block** - Rich text with formatting
- **Heading Block** - H1, H2, H3 with styling options
- **Image Block** - Image with caption and alignment
- **Button Block** - CTA button with link
- **Container Block** - Wrapper for layout (columns, spacing)
- **List Block** - Bullet/numbered lists
- **Divider Block** - Horizontal rule

#### Component Toolbox
A sidebar with draggable components that users can add to the page.

### 3. Implementation Files

#### [NEW] [Craft.js Components](file:///c:/Users/Raymo/Documents/GitHub/New-PiRA-Platform/components/builder)
- `components/builder/Text.tsx` - Text block component
- `components/builder/Heading.tsx` - Heading component
- `components/builder/Image.tsx` - Image component
- `components/builder/Button.tsx` - Button component
- `components/builder/Container.tsx` - Layout container
- `components/builder/Toolbox.tsx` - Component palette

#### [NEW] [Page Builder Editor](file:///c:/Users/Raymo/Documents/GitHub/New-PiRA-Platform/components/admin/PageBuilder.tsx)
- Craft.js `<Editor>` wrapper
- Toolbar with Save/Cancel
- Component toolbox
- Settings panel for selected component

#### [MODIFY] [About Page](file:///c:/Users/Raymo/Documents/GitHub/New-PiRA-Platform/app/about/page.tsx)
- Check `editorType` field
- Render `PageBuilder` for admins if `editorType === "builder"`
- Render Craft.js viewer for non-admins

#### [MODIFY] [Blog Post Page](file:///c:/Users/Raymo/Documents/GitHub/New-PiRA-Platform/app/blog/[slug]/page.tsx)
- Same logic as About page

#### [NEW] [Migration Script](file:///c:/Users/Raymo/Documents/GitHub/New-PiRA-Platform/scripts/migrate-to-builder.ts)
- Optional: Convert existing HTML content to Craft.js blocks

## Installation

```bash
npm install @craftjs/core
```

## User Flow

### Admin Editing Flow
1. Admin visits `/about` or `/blog/[slug]`
2. Sees "Edit with Page Builder" button
3. Clicks button → Enters builder mode
4. Can drag components from toolbox
5. Can rearrange existing blocks
6. Can edit block settings (text, colors, spacing)
7. Clicks "Save" → Stores JSON to `builderData` field
8. Page refreshes with new content

### Non-Admin View
1. User visits page
2. Craft.js renders the saved JSON as static HTML
3. No editing controls visible

## Migration Strategy

**Phase 1: Dual Support**
- Keep existing HTML content working
- Add `editorType` field to distinguish
- New pages use builder by default

**Phase 2: Gradual Migration**
- Admins can choose to "Upgrade to Page Builder"
- Converts HTML to basic Craft.js blocks
- Old HTML remains as fallback

## Verification Plan

### Manual Testing
1. **Create New Page**: Use builder to create a page from scratch
2. **Drag & Drop**: Verify components can be dragged and rearranged
3. **Edit Settings**: Change text, colors, spacing
4. **Save & Reload**: Verify changes persist
5. **Non-Admin View**: Verify page renders correctly for non-admins
6. **Backward Compatibility**: Verify old HTML pages still work

## Estimated Effort
- **Setup & Components**: 4-6 hours
- **Integration**: 2-3 hours
- **Testing & Polish**: 2-3 hours
- **Total**: 8-12 hours

## Notes
- Craft.js is lightweight and React-based (good fit for Next.js)
- No external dependencies or API calls
- All data stored in your database
- Full control over component library
