# 📖 Article Reader

A modern, intelligent article reading application that extracts clean content from any URL and provides an enhanced reading experience with text-to-speech functionality and smart sentence highlighting.

## 🌟 Features

### 📰 Smart Article Extraction
- **Universal URL Support**: Extract readable content from any article URL
- **Clean Content Parsing**: Uses Mozilla's Readability library for intelligent content extraction
- **Automatic Formatting**: Preserves paragraph structure and removes clutter

### 🎵 Intelligent Text-to-Speech
- **Natural Voice Reading**: High-quality text-to-speech with customizable settings
- **Sentence Highlighting**: Real-time highlighting of currently spoken text
- **Smart Scrolling**: Automatic scroll to keep current sentence in view
- **Full Playback Control**: Play, pause, resume, and stop functionality

### 🎨 Modern User Interface
- **Beautiful Design**: Modern gradient-based UI with smooth animations
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Accessibility Focused**: Clean typography and intuitive controls
- **Real-time Progress**: Live reading progress indicator

## 🚀 Live Demo

**[Try Article Reader Live →](https://read-online.vercel.app)**

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.4.2 with App Router
- **Framework**: React 19.1.0 with TypeScript
- **Styling**: Tailwind CSS v4
- **Content Extraction**: Mozilla Readability + JSDOM
- **Speech**: Web Speech API
- **Deployment**: Vercel

## 🏗️ Project Structure

```
read-article/
├── app/
│   ├── api/
│   │   └── extract/
│   │       └── route.ts          # Article extraction API endpoint
│   ├── page.tsx                  # Main application component
│   ├── layout.tsx                # App layout and metadata
│   └── globals.css               # Global styles
├── public/                       # Static assets
├── package.json                  # Dependencies and scripts
└── README.md                     # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/read-article.git
   cd read-article
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application running.

### Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## 📖 How to Use

1. **Enter Article URL**: Paste any article URL into the input field
2. **Extract Content**: Click "Extract Article" to fetch and parse the content
3. **Read Article**: Browse the clean, formatted article content
4. **Listen to Article**: Use the audio controls to have the article read aloud
5. **Follow Along**: Watch as sentences are highlighted during speech playback

## 🔧 API Reference

### POST `/api/extract`

Extracts readable content from a given URL.

**Request Body:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "title": "Article Title",
  "content": "Formatted article content with preserved paragraphs",
  "excerpt": "Article summary or excerpt"
}
```

**Error Responses:**
- `400`: Invalid or missing URL
- `500`: Failed to fetch or parse article

## 🌐 Browser Compatibility

- **Text-to-Speech**: Requires browsers with Web Speech API support
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Support**: iOS Safari, Chrome Mobile, Samsung Internet

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Maintain existing code style and formatting
- Add appropriate comments for complex functionality
- Test your changes across different browsers
- Ensure responsive design compatibility

## 🐛 Issues and Support

If you encounter any issues or have suggestions:

1. **Check existing issues** in the GitHub repository
2. **Create a new issue** with detailed description
3. **Include steps to reproduce** any bugs
4. **Specify browser and device** information

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### MIT License Summary

- ✅ **Commercial use**
- ✅ **Modification**
- ✅ **Distribution**
- ✅ **Private use**
- ❌ **Liability**
- ❌ **Warranty**

## 🙏 Acknowledgments

- **[Mozilla Readability](https://github.com/mozilla/readability)** - For excellent content extraction
- **[Next.js](https://nextjs.org)** - For the amazing React framework
- **[Tailwind CSS](https://tailwindcss.com)** - For beautiful, utility-first styling
- **[Vercel](https://vercel.com)** - For seamless deployment platform

## 🚀 Deployment

This project is deployed on **Vercel**. To deploy your own instance:

1. **Push to GitHub** (or your preferred Git provider)
2. **Connect to Vercel** via their dashboard
3. **Configure build settings** (auto-detected for Next.js)
4. **Deploy** - Vercel handles the rest!

For manual deployment:
```bash
npm run build
npm run start
```

---

**[🌐 Live Demo](https://read-online.vercel.app)** | **[📋 Report Bug](https://github.com/yourusername/read-article/issues)** | **[💡 Request Feature](https://github.com/yourusername/read-article/issues)**

Made with ❤️ for better online reading experiences
