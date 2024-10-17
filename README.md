# My personal homepage

This project sets up a development environment for building a static website using HTML, Sass, and JavaScript. It includes auto-compilation of Sass to CSS, browser auto-reloading for development, and a build process for production that includes minification.

## Project Structure

```
yurivictor-website-source/
├── src/
│   ├── index.html
│   ├── js/
│   │   └── main.js
│   └── scss/
│       └── main.scss
├── package.json
└── README.md
```

## Setup

1. Clone this repository.

2. Install dependencies:
   ```
   npm install
   ```

## Usage

### Development

1. Start the development server:
   ```
   npm start
   ```
   This will compile your Sass to CSS, start a local server, and open your website in a browser. Any changes you make to your HTML, Sass, or JavaScript files will trigger a browser reload.

2. In your `src/index.html`, include your CSS and JavaScript like this:
   ```html
   <link rel="stylesheet" href="css/main.css">
   <script src="js/main.js" defer></script>
   ```

### Production Build

When you're ready to build your project for production:

1. Run the build script:
   ```
   npm run build
   ```
   This will compile your Sass, autoprefix and minify your CSS, and copy your HTML and JavaScript files to a `dist` folder.

2. The `dist` folder will contain your production-ready files.

### Deployment

This project is automatically deployed to @yurivictor/yurivictor.github.io.

## Customization

- Modify `src/scss/main.scss` to add your custom styles.
- Edit `src/js/main.js` to add your JavaScript functionality.
- Update `src/index.html` for your HTML structure.

## Contributing

Feel free to fork this project and submit pull requests with improvements or bug fixes.

## License

This project is open source and available under the [MIT License](LICENSE).