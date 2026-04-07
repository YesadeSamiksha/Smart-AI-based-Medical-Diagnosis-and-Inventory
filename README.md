# Smart AI-based Medical Diagnosis and Inventory

🏥 **MedAI** - An AI-powered medical diagnosis platform with inventory management capabilities.

## Features

- 🩺 **AI-Powered Diagnosis**: Get instant health assessments for:
  - Diabetes Risk Assessment
  - Lung Cancer Screening
  - Blood Pressure Analysis
  
- 🎯 **Accessibility Features**:
  - Voice Control & Navigation
  - Color Blind Support
  - AI Assistant
  - Screen Reader Compatible

- 💊 **Inventory Management**: Track and manage medical supplies

- 🔐 **Secure Authentication**: User login and registration system

- 📊 **Dashboard**: Comprehensive user dashboard with health tracking

- 🎨 **Modern UI**: Beautiful dark theme with 3D effects and animations

## Project Structure

```
Smart-AI-based-Medical-Diagnosis-and-Inventory/
├── index.html                 # Landing page
├── login.html                 # Authentication page
├── dashboard.html             # User dashboard
├── diagnosis-diabetes.html    # Diabetes assessment
├── diagnosis-lung.html        # Lung cancer screening
├── diagnosis-bp.html          # Blood pressure analysis
├── symptom-checker.html       # Symptom checker tool
├── inventory.html             # Inventory management
├── admin.html                 # Admin panel
├── styles.css                 # Global styles
├── src/
│   ├── script.js              # Main JavaScript
│   ├── ballpit.js             # Three.js ballpit animation
│   ├── pill-nav.js            # Navigation animations
│   └── spotlight.js           # Spotlight card effects
├── package.json               # NPM configuration
└── README.md                  # This file
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Smart-AI-based-Medical-Diagnosis-and-Inventory
```

2. Install dependencies (optional, for development server):
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Or simply open `index.html` in your web browser.

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Frameworks**: Bootstrap 5, Tailwind CSS
- **Animations**: GSAP (GreenSock), Three.js
- **Icons**: Font Awesome 6
- **APIs**: Web Speech API (Voice Recognition & Synthesis)

## Usage

### For Users

1. Visit the landing page
2. Sign up or log in to your account
3. Choose a diagnosis service from the dashboard
4. Complete the health assessment
5. View your results and recommendations

### Voice Commands

Activate voice control and say:
- "Home" - Navigate to home page
- "Features" - View features
- "Diabetes" - Start diabetes assessment
- "Lung cancer" - Start lung cancer screening
- "Blood pressure" - Start BP analysis

## Development

### Creating New Pages

All pages follow the same structure:
1. Include Bootstrap and Tailwind CSS
2. Link to styles.css
3. Include Font Awesome for icons
4. Add navigation component
5. Include relevant JavaScript files

### Adding New Features

- JavaScript files go in the `src/` directory
- CSS should be added to `styles.css`
- Use the existing design system (colors, spacing, etc.)

## Medical Disclaimer

⚠️ **IMPORTANT**: MedAI provides preliminary health assessments and should NOT replace professional medical advice. Always consult qualified healthcare providers for proper diagnosis and treatment. Our AI assists in early detection, but final medical decisions should be made by licensed physicians.

## Browser Support

- ✅ Chrome/Edge (Recommended for voice features)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for educational purposes.

## Contact

For questions or support, use the contact form on the website or reach out to the development team.

---

Made with ❤️ by the MedAI Team