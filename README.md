# pfps

A minimalist, high-performance library for managing and viewing profile pictures. Built to be fast, highly searchable, and aesthetically pleasing across all devices.

## What's inside?

- **Real-time Search**: Instant filtering by name, path, or tags.
- **Clickable Tags**: Navigate your library through interconnected metadata.
- **Forced Downloads**: Robust blob-based downloading that works locally and on GitHub Pages.
- **Ultra-Smooth UI**: Seamless transitions between clean dark and light modes.
- **Mobile Optimized**: Designed for touch, with network-aware local hosting for mobile testing.
- **Automatic Deployment**: GitHub Actions integration for seamless library updates.

## Advanced Management

### The Web Interface
Click the **+** button to access the advanced upload portal.
- **Folder Management**: Select from existing categories or create new ones on the fly.
- **Metadata Support**: Assign names, tags, and source links during upload.

### The CLI Toolkit
Power users can manage the library directly from the terminal:
- `npm run sync`: Rescans the `library/` folder while respecting `.syncignore`.
- `npm run tag <name|path> "tags" [- "source"]`: Rapidly update metadata.
- `npm run duplicate`: Identifies images with identical resolution and file size.
- `npm run list`: Provides a comprehensive summary of library contents.

## Configuration

### `.syncignore`
Use a `.syncignore` file in the root to exclude specific files or folders (e.g., `temp/`, `wip/`, `.DS_Store`) from the sync process. It follows a simple, case-insensitive filename matching pattern.

## Getting Started

1. **Initialize**: `npm install`
2. **Synchronize**: `npm run sync`
3. **Launch Dev Server**: `npm start`
4. **Access**: 
   - Local: `http://localhost:3000`
   - Network: `http://<your-ip>:3000` (Access from your phone on the same Wi-Fi)

Simple. Effective. Clean.
