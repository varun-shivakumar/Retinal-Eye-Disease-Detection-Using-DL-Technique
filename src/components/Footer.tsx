import React from 'react';

const Footer = () => {
  return (
    <footer className="py-6 mt-auto border-t border-slate-100 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} Shreyas Sangalad. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
