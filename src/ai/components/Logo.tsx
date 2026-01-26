import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 24 }) => {
  return (
    <>
      <style>
        {`
          @keyframes mantivoColorFlow {
            0% { background-color: #2563eb; } /* blue-600 */
            100% { background-color: #f97316; } /* orange-500 */
          }
          
          @keyframes mantivoZoomPulse {
            0% { transform: scale(1); }
            100% { transform: scale(1.35); }
          }
        `}
      </style>
      
      <div 
        className={`flex items-center justify-center rounded-lg shadow-sm overflow-hidden ${className}`}
        style={{ 
          width: size, 
          height: size,
          animation: 'mantivoColorFlow 4s infinite alternate ease-in-out' 
        }}
        title="Mantivo"
      >
        <span 
          className="text-white font-extrabold select-none leading-none"
          style={{ 
            fontSize: size * 0.65,
            animation: 'mantivoZoomPulse 3s infinite alternate ease-in-out'
          }}
        >
          M
        </span>
      </div>
    </>
  );
};

export default Logo;