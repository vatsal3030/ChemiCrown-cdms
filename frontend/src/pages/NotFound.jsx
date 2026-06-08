import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PackageX, ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1
          }}
          className="mx-auto w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center shadow-inner"
        >
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 10, 0],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              repeatDelay: 3 
            }}
          >
            <PackageX className="w-16 h-16 text-blue-600" />
          </motion.div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-8xl font-black text-gray-900 tracking-tighter">404</h1>
          <h2 className="text-2xl font-bold text-gray-800">
            Looks like you wandered into the wrong warehouse. 🧪
          </h2>
          <p className="text-gray-500">
            The page or chemical component you're looking for has evaporated, been moved, or never existed in the first place.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
          
          <Link
            to="/dashboard"
            className="flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5 mr-2" />
            Return Home
          </Link>
        </motion.div>

      </div>
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[20%] left-[40%] w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000" />
      </div>
    </div>
  );
};

export default NotFound;
