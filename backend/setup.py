#!/usr/bin/env python3
"""
Setup script for EyeAnalyzer backend
Creates necessary directories and initializes the database
"""

import os
import sqlite3
import json

def create_directories():
    """Create required directories for the application"""
    directories = ['models', 'uploads', 'static_heatmaps']
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"✓ Created directory: {directory}")
        else:
            print(f"✓ Directory already exists: {directory}")

def create_database():
    """Initialize the SQLite database with required tables"""
    try:
        conn = sqlite3.connect('predictions.db')
        cursor = conn.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          predicted_disease TEXT NOT NULL,
          confidence REAL NOT NULL,
          probabilities TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        conn.commit()
        conn.close()
        print("✓ Database initialized successfully")
        
    except Exception as e:
        print(f"✗ Error creating database: {e}")
        return False
    
    return True

def create_sample_class_names():
    """Create a sample class_names.json file if it doesn't exist"""
    class_names_path = 'models/class_names.json'
    
    if not os.path.exists(class_names_path):
        class_names = ["cataract", "diabetic_retinopathy", "glaucoma", "normal"]
        
        with open(class_names_path, 'w') as f:
            json.dump(class_names, f, indent=2)
            
        print(f"✓ Created sample class names file: {class_names_path}")
        print("  Please update this file to match your model's classes")
    else:
        print(f"✓ Class names file already exists: {class_names_path}")

def main():
    print("Setting up EyeAnalyzer backend...")
    print("=" * 50)
    
    # Create directories
    create_directories()
    
    # Initialize database
    create_database()
    
    # Create sample class names
    create_sample_class_names()
    
    print("=" * 50)
    print("Setup completed!")
    print("\nNext steps:")
    print("1. Place your trained model file in: models/densmodel_keras.keras")
    print("2. Update models/class_names.json with your model's class names")
    print("3. Install dependencies: pip install -r requirements.txt")
    print("4. Run the server: python app.py")
    
    # Check if model file exists
    model_path = 'models/densmodel_keras.keras'
    if not os.path.exists(model_path):
        print(f"\n⚠️  WARNING: Model file not found at {model_path}")
        print("   The application will not work without a trained model.")

if __name__ == "__main__":
    main()