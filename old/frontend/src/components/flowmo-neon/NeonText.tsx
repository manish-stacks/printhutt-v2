import { multiColors } from '@/app/product/flow-mo-neon-sign/_data/colors';
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Draggable from "react-draggable";


interface NeonTextProps {
  text: string;
  color: string | string[];
  font: string;
  width: number;
  height: number;
  fontSize: number;
  textAlignment: string;
  rounded?: boolean;
  multiColorMode?: 'word' | 'letter' | 'gradient' | 'flow';
  animationSpeed?: number;
}

export const NeonText: React.FC<NeonTextProps> = ({
  text,
  color,
  font,
  width,
  height,
  fontSize,
  textAlignment,
  rounded = false,
  multiColorMode = 'flow',
  animationSpeed = 2000
}) => {
  const [flowOffset, setFlowOffset] = useState(0);
  const [responsiveFontSize, setResponsiveFontSize] = useState(fontSize);

  const colors = useMemo(() => multiColors.map(c => c.value), []);

  // Responsive font size
  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 480) {
        setResponsiveFontSize(fontSize * 0.5);
      } else if (screenWidth < 768) {
        setResponsiveFontSize(fontSize * 0.7);
      } else if (screenWidth < 1024) {
        setResponsiveFontSize(fontSize * 0.85);
      } else {
        setResponsiveFontSize(fontSize);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fontSize]);

  useEffect(() => {
    if (multiColorMode === 'flow') {
      const interval = setInterval(() => {
        setFlowOffset(prev => (prev + 1) % (colors.length * 10));
      }, Math.max(animationSpeed / 20, 50));
      return () => clearInterval(interval);
    }
  }, [multiColorMode, animationSpeed, colors.length]);

  const createGradientStyle = useCallback((currentColor: string): React.CSSProperties => ({
    color: currentColor,
    fontSize: `${responsiveFontSize}px`,
    fontFamily: font,
    fontWeight: 'bold',
    textShadow: `
      2px 2px 4px rgba(0, 0, 0, 0.5), 
      0px 0px 10px ${currentColor}88,
      0px 0px 20px ${currentColor}66,
      0px 0px 30px ${currentColor}44
    `,
  }), [responsiveFontSize, font]);

  const baseStyle: React.CSSProperties = useMemo(() => ({
    fontSize: `${responsiveFontSize}px`,
    fontFamily: font,
    fontWeight: 'bold',
    whiteSpace: 'pre-wrap' as const,
    textAlign: textAlignment as string,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    lineHeight: '100px',
    background: rounded ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
    borderRadius: rounded ? '25px' : '0px',
    border: rounded ? '2px solid rgba(255, 255, 255, 0.2)' : 'none',
    backdropFilter: rounded ? 'blur(10px)' : 'none',
  }), [responsiveFontSize, font, textAlignment, rounded]);

  const renderedText = useMemo(() => {
    const displayText = text || 'Your Text';
    const allColorsGradient = colors.join(', ');
    const lines = displayText.split('\n');

    if (multiColorMode === 'flow') {
      return lines.map((line, lineIndex) => (
        <div key={`line-${lineIndex}`} style={{ textAlign: textAlignment as any }}>
          {line.split('').map((char, charIndex) => {
            if (char === ' ') {
              return <span key={`${lineIndex}-${charIndex}`}>&nbsp;</span>;
            }
            const globalIndex = lines.slice(0, lineIndex).join('').length + charIndex;
            const colorIndex = Math.floor((globalIndex + flowOffset) / 3) % colors.length;
            const currentColor = colors[colorIndex];
            return (
              <span
                key={`${lineIndex}-${charIndex}`}
                style={{
                  ...createGradientStyle(currentColor),
                  transition: 'all 0.3s ease',
                  display: 'inline-block',
                  filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3))',
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
      ));
    }

    if (multiColorMode === 'gradient') {
      return lines.map((line, lineIndex) => (
        <div key={`line-${lineIndex}`} style={{ textAlign: textAlignment as any }}>
          <span style={{
            fontSize: `${responsiveFontSize}px`,
            fontFamily: font,
            fontWeight: 'bold',
            background: `linear-gradient(to right, ${allColorsGradient}, ${allColorsGradient})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            backgroundSize: '200% 100%',
            animation: 'gradientFlowLeftRight 3s linear infinite',
            filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.4)) drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.2))',
          }}>
            {line}
          </span>
        </div>
      ));
    }

    if (multiColorMode === 'word') {
      return lines.map((line, lineIndex) => (
        <div key={`line-${lineIndex}`} style={{ textAlign: textAlignment as any }}>
          {line.split(' ').map((word, wordIndex) => (
            <React.Fragment key={`word-${lineIndex}-${wordIndex}`}>
              <span style={{
                ...createGradientStyle(colors[wordIndex % colors.length]),
                transition: 'color 0.5s ease',
                filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3))',
              }}>
                {word}
              </span>
              {wordIndex < line.split(' ').length - 1 && <span>&nbsp;</span>}
            </React.Fragment>
          ))}
        </div>
      ));
    }

    if (multiColorMode === 'letter') {
      return lines.map((line, lineIndex) => (
        <div key={`line-${lineIndex}`} style={{ textAlign: textAlignment as any }}>
          {line.split('').map((char, charIndex) => {
            if (char === ' ') {
              return <span key={`${lineIndex}-${charIndex}`}>&nbsp;</span>;
            }
            const globalIndex = lines.slice(0, lineIndex).join('').length + charIndex;
            return (
              <span
                key={`${lineIndex}-${charIndex}`}
                style={{
                  ...createGradientStyle(colors[globalIndex % colors.length]),
                  display: 'inline-block',
                  transition: 'color 0.3s ease',
                  filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3))',
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
      ));
    }

    const defaultColor = Array.isArray(color) ? color[0] : color;
    return lines.map((line, lineIndex) => (
      <div key={`line-${lineIndex}`} style={{ textAlign: textAlignment as any }}>
        <span style={{
          ...createGradientStyle(defaultColor),
          filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))',
        }}>
          {line}
        </span>
      </div>
    ));
  }, [text, flowOffset, responsiveFontSize, font, multiColorMode, colors, createGradientStyle, color, textAlignment]);

  const nodeRef = useRef(null);

  const generateAnimationCSS = useCallback(() => {
    return `
      @keyframes gradientFlowLeftRight {
        0% { background-position: -200% 0%; }
        100% { background-position: 200% 0%; }
      }
    `;
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: generateAnimationCSS() }} />
      <Draggable
        nodeRef={nodeRef}
        bounds="parent"
        defaultPosition={{ x: 0, y: 0 }}>
        <div className="relative group cursor-move" ref={nodeRef}>
          <div
            className="transition-all duration-300 max-[567px]:!leading-[2rem]"
            style={baseStyle}
          >
            {renderedText}
          </div>

          {/* Measurement indicators */}
          <div className="absolute top-1/2 -left-8 w-8 border-t border-gray-400 opacity-100 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-1/2 -right-8 w-8 border-t border-gray-400 opacity-100 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -top-8 left-1/2 h-8 border-l border-gray-400 opacity-100 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -bottom-8 left-1/2 h-8 border-l border-gray-400 opacity-100 group-hover:opacity-100 transition-opacity" />

          {/* Dimension labels */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-2 py-1 rounded text-sm opacity-100 group-hover:opacity-100 transition-opacity">
            {width}&quot;
          </div>
          <div className="absolute bottom-[38%] -left-20 transform -translate-y-1/2 bg-black/75 text-white px-2 py-1 rounded text-sm opacity-100 group-hover:opacity-100 transition-opacity">
            {height}&quot;
          </div>
        </div>
      </Draggable>
    </>
  );
};


