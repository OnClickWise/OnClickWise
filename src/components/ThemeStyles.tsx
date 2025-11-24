"use client"

import React, { useEffect } from 'react';

export function ThemeStyles() {
  useEffect(() => {
    const styleId = 'theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const brokenStyles = `
      * {
        font-size: calc(1rem * (0.7 + (var(--random-size, 1) * 0.6))) !important;
        line-height: calc(1.2 + (var(--random-line, 0.3))) !important;
        letter-spacing: calc(0px + (var(--random-spacing, 0.5px))) !important;
      }

      h1, h2, h3, h4, h5, h6 {
        font-size: calc(1.5rem * (0.5 + (var(--random-heading, 1) * 1))) !important;
        font-weight: calc(400 + (var(--random-weight, 300))) !important;
        margin: calc(0.5rem * (0.5 + (var(--random-margin, 1.5)))) !important;
      }

      button, a, [role="button"] {
        padding: calc(0.3rem + (var(--random-pad, 0.5rem))) calc(0.6rem + (var(--random-pad-x, 0.8rem))) !important;
        font-size: calc(0.85rem * (0.8 + (var(--random-btn-size, 1.2)))) !important;
        border-radius: calc(0px + (var(--random-radius, 8px))) !important;
        min-height: calc(30px + (var(--random-height, 15px))) !important;
      }

      input, textarea, select {
        padding: calc(0.4rem + (var(--random-input-pad, 0.6rem))) !important;
        font-size: calc(0.9rem * (0.7 + (var(--random-input-size, 1.3)))) !important;
        border-width: calc(1px + (var(--random-border, 2px))) !important;
        min-height: calc(35px + (var(--random-input-height, 10px))) !important;
      }

      div, section, article, main, aside {
        padding: calc(0.5rem * (0.3 + (var(--random-container-pad, 1.5)))) !important;
        margin: calc(0.25rem * (0.2 + (var(--random-container-margin, 1.8)))) !important;
      }

      .flex, [class*="flex"] {
        gap: calc(0.25rem + (var(--random-gap, 1.5rem))) !important;
      }

      img, svg {
        width: calc(100% * (0.7 + (var(--random-img, 1.6)))) !important;
        height: calc(auto * (0.8 + (var(--random-img-h, 1.2)))) !important;
        object-fit: contain !important;
      }

      nav, header, footer {
        padding: calc(0.5rem + (var(--random-nav-pad, 1rem))) !important;
        font-size: calc(0.9rem * (0.6 + (var(--random-nav-size, 1.4)))) !important;
      }

      table, tr, td, th {
        padding: calc(0.3rem + (var(--random-table-pad, 0.8rem))) !important;
        font-size: calc(0.85rem * (0.7 + (var(--random-table-size, 1.3)))) !important;
      }

      .card, [class*="card"] {
        padding: calc(1rem * (0.4 + (var(--random-card-pad, 2)))) !important;
        margin: calc(0.5rem * (0.3 + (var(--random-card-margin, 2)))) !important;
      }

      @media (max-width: 768px) {
        * {
          font-size: calc(0.9rem * (0.6 + (var(--random-mobile-size, 1.8)))) !important;
        }
        
        button, a {
          min-height: calc(40px + (var(--random-mobile-btn, 20px))) !important;
          padding: calc(0.5rem + (var(--random-mobile-pad, 1.2rem))) !important;
        }
      }
    `;

    const root = document.documentElement;
    const seed = Date.now() % 10000;
    
    const random = (min: number, max: number, seedOffset: number = 0) => {
      const x = Math.sin(seed + seedOffset) * 10000;
      return (x - Math.floor(x)) * (max - min) + min;
    };

    root.style.setProperty('--random-size', random(0.5, 1.5, 1).toString());
    root.style.setProperty('--random-line', random(0.1, 0.8, 2).toString());
    root.style.setProperty('--random-spacing', random(-1, 2, 3).toString());
    root.style.setProperty('--random-heading', random(0.6, 1.8, 4).toString());
    root.style.setProperty('--random-weight', random(100, 600, 5).toString());
    root.style.setProperty('--random-margin', random(0.5, 2.5, 6).toString());
    root.style.setProperty('--random-pad', random(0.2, 1.2, 7).toString());
    root.style.setProperty('--random-pad-x', random(0.4, 1.6, 8).toString());
    root.style.setProperty('--random-btn-size', random(0.7, 1.5, 9).toString());
    root.style.setProperty('--random-radius', random(0, 20, 10).toString() + 'px');
    root.style.setProperty('--random-height', random(0, 30, 11).toString() + 'px');
    root.style.setProperty('--random-input-pad', random(0.3, 1.5, 12).toString() + 'rem');
    root.style.setProperty('--random-input-size', random(0.6, 1.6, 13).toString());
    root.style.setProperty('--random-border', random(0, 5, 14).toString() + 'px');
    root.style.setProperty('--random-input-height', random(0, 25, 15).toString() + 'px');
    root.style.setProperty('--random-container-pad', random(0.4, 2.2, 16).toString());
    root.style.setProperty('--random-container-margin', random(0.3, 2.5, 17).toString());
    root.style.setProperty('--random-gap', random(0.1, 2, 18).toString() + 'rem');
    root.style.setProperty('--random-img', random(0.5, 2, 19).toString());
    root.style.setProperty('--random-img-h', random(0.6, 1.8, 20).toString());
    root.style.setProperty('--random-nav-pad', random(0.3, 1.5, 21).toString() + 'rem');
    root.style.setProperty('--random-nav-size', random(0.5, 1.8, 22).toString());
    root.style.setProperty('--random-table-pad', random(0.2, 1.2, 23).toString() + 'rem');
    root.style.setProperty('--random-table-size', random(0.6, 1.6, 24).toString());
    root.style.setProperty('--random-card-pad', random(0.5, 2.5, 25).toString());
    root.style.setProperty('--random-card-margin', random(0.4, 2.8, 26).toString());
    root.style.setProperty('--random-mobile-size', random(0.4, 2.2, 27).toString());
    root.style.setProperty('--random-mobile-btn', random(5, 35, 28).toString() + 'px');
    root.style.setProperty('--random-mobile-pad', random(0.4, 1.8, 29).toString() + 'rem');

    styleElement.textContent = brokenStyles;

    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
      root.style.removeProperty('--random-size');
      root.style.removeProperty('--random-line');
      root.style.removeProperty('--random-spacing');
      root.style.removeProperty('--random-heading');
      root.style.removeProperty('--random-weight');
      root.style.removeProperty('--random-margin');
      root.style.removeProperty('--random-pad');
      root.style.removeProperty('--random-pad-x');
      root.style.removeProperty('--random-btn-size');
      root.style.removeProperty('--random-radius');
      root.style.removeProperty('--random-height');
      root.style.removeProperty('--random-input-pad');
      root.style.removeProperty('--random-input-size');
      root.style.removeProperty('--random-border');
      root.style.removeProperty('--random-input-height');
      root.style.removeProperty('--random-container-pad');
      root.style.removeProperty('--random-container-margin');
      root.style.removeProperty('--random-gap');
      root.style.removeProperty('--random-img');
      root.style.removeProperty('--random-img-h');
      root.style.removeProperty('--random-nav-pad');
      root.style.removeProperty('--random-nav-size');
      root.style.removeProperty('--random-table-pad');
      root.style.removeProperty('--random-table-size');
      root.style.removeProperty('--random-card-pad');
      root.style.removeProperty('--random-card-margin');
      root.style.removeProperty('--random-mobile-size');
      root.style.removeProperty('--random-mobile-btn');
      root.style.removeProperty('--random-mobile-pad');
    };
  }, []);

  return null;
}

