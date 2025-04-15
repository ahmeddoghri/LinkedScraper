# Creating Icons for the Extension

To add icons to the extension, you need to create three icon files in the `images` directory:

1. `icon16.png` (16x16 pixels)
2. `icon48.png` (48x48 pixels) 
3. `icon128.png` (128x128 pixels)

## Option 1: Create Simple Icons

You can create simple icon files using online tools or any image editor. Use LinkedIn blue (#0a66c2) for a consistent look.

## Option 2: Restore Icon References in Manifest

Once you have created the icon files, you can restore the icon references in `manifest.json` by adding the following to the "action" section:

```json
"default_icon": {
  "16": "images/icon16.png",
  "48": "images/icon48.png",
  "128": "images/icon128.png"
}
```

For example:
```json
"action": {
  "default_popup": "popup.html",
  "default_icon": {
    "16": "images/icon16.png",
    "48": "images/icon48.png",
    "128": "images/icon128.png"
  }
}
```

## Option 3: Use Favicon Generator

You can use online favicon generators to create icon sets. Some popular options:
- https://favicon.io/
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

Generate a complete set of icons and place them in the `images` directory. 