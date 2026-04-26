# pfps

This is a simple, minimalist library for managing and viewing profile pictures. It's built to be fast, easy to search, and looks good in both light and dark modes.

## What's inside?

- **Real-time Search**: Quickly find what you're looking for by name or tags.
- **Clickable Tags**: See a tag you like? Click it to instantly see all similar images.
- **Ultra-Smooth Themes**: A clean dark and light mode that transitions beautifully.
- **Mobile Friendly**: Works just as well on your phone as it does on your desktop.
- **Automatic Deployment**: Push your changes to GitHub, and the library updates itself.

## Managing your library

### The Web Way
If you're running the project locally, just click the **+** button in the bottom right to upload new images. You can add names, categories, tags, and source links right there.

### The CLI Way
For those who prefer the terminal, there are a few handy commands:
- `npm run sync`: Rescans your folders and updates the data (without losing your tags).
- `npm run tag <path> "tag1, tag2"`: Quickly tag an image from the terminal.
- `npm run list`: Get a quick summary of everything in your library.

## Getting Started

1. **Install things**: `npm install`
2. **Scan your files**: `npm run sync`
3. **Start the local server**: `npm start`
4. **View it**: Open `http://localhost:3000`

That's pretty much it. Simple, effective, and clean.
