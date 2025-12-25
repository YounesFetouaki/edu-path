import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_curve, auc, confusion_matrix, accuracy_score
import xgboost as xgb
import os

# Set style for publication quality figures
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_context("paper", font_scale=1.5)

FIGURES_DIR = os.path.join(os.path.dirname(__file__), 'figures')
os.makedirs(FIGURES_DIR, exist_ok=True)

def generate_synthetic_data(n_samples=1200):
    """
    Generates a synthetic dataset matching the description in the EduPath Report.
    1200 students, features like:
    - quiz_submission_latency
    - quiz_avg_score
    - total_login_days
    - avg_video_watch_percent
    - forum_post_count
    """
    np.random.seed(42)
    
    # Generate balanced classification problem first
    X, y = make_classification(
        n_samples=n_samples,
        n_features=10,
        n_informative=5,
        n_redundant=2,
        n_clusters_per_class=1,
        weights=[0.71, 0.29], # 71% Pass, 29% Fail as per table in report
        random_state=42
    )
    
    # Map generic features to named features from the report for "realism" in feature importance (optional, but good for consistency)
    feature_names = [
        'quiz_submission_latency', 'quiz_avg_score', 'total_login_days', 
        'avg_video_watch_percent', 'forum_post_count', 'total_session_time',
        'video_pause_rate', 'forum_read_count', 'login_regularity_score', 'device_diversity'
    ]
    
    df = pd.DataFrame(X, columns=feature_names)
    df['risk_factor'] = y # 1 = Fail, 0 = Pass
    
    return df, feature_names

def train_and_plot_roc(df, feature_names):
    print("Training XGBoost Model...")
    X = df[feature_names]
    y = df['risk_factor']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Hyperparameters from report
    model = xgb.XGBClassifier(
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        n_estimators=100,
        eval_metric='logloss',
        use_label_encoder=False
    )
    
    model.fit(X_train, y_train)
    
    # Predict probabilities
    y_scores = model.predict_proba(X_test)[:, 1]
    
    # Compute ROC curve and ROC area
    fpr, tpr, _ = roc_curve(y_test, y_scores)
    roc_auc = auc(fpr, tpr)
    print(f"ROC AUC: {roc_auc:.4f}")
    
    # Plot ROC Curve
    plt.figure(figsize=(10, 8))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate (1 - Specificity)')
    plt.ylabel('True Positive Rate (Sensitivity)')
    plt.title('Receiver Operating Characteristic (ROC) - PathPredictor')
    plt.legend(loc="lower right")
    
    output_path = os.path.join(FIGURES_DIR, 'roc_curve.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"Saved ROC Curve to {output_path}")
    plt.close()

def plot_model_architecture():
    """
    Creates a conceptual diagram of the Architecture since we can't easily draw the actual network.
    We will create a block diagram using matplotlib patches.
    """
    import matplotlib.patches as patches
    
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.axis('off')
    
    # Define boxes
    boxes = {
        'LMS': (0.05, 0.4, 0.15, 0.2, 'LMS Data\n(Moodle/Canvas)', '#e1f5fe'),
        'ETL': (0.25, 0.4, 0.15, 0.2, 'PrepaData\n(ETL)', '#fff9c4'),
        'DB': (0.45, 0.6, 0.1, 0.3, 'Database\n(PostgreSQL)', '#e0e0e0'),
        'Profiler': (0.45, 0.1, 0.15, 0.2, 'StudentProfiler\n(Clustering)', '#ffe0b2'),
        'Predictor': (0.65, 0.4, 0.15, 0.2, 'PathPredictor\n(XGBoost)', '#c8e6c9'),
        'App': (0.85, 0.4, 0.1, 0.2, 'App\n(Flutter)', '#f3e5f5')
    }
    
    for name, (x, y, w, h, label, color) in boxes.items():
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02", ec="black", fc=color, mutation_scale=0.5)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, label, ha='center', va='center', fontsize=10, fontweight='bold')
        
    # Arrows
    arrows = [
        ((0.2, 0.5), (0.25, 0.5)), # LMS -> ETL
        ((0.4, 0.5), (0.65, 0.5)), # ETL -> Predictor (skipping DB visual for simplicity or going through it)
        ((0.4, 0.5), (0.45, 0.2)), # ETL -> Profiler
        ((0.4, 0.5), (0.45, 0.75)), # ETL -> DB
        ((0.8, 0.5), (0.85, 0.5)), # Predictor -> App
    ]
    
    for start, end in arrows:
        ax.annotate("", xy=end, xytext=start, arrowprops=dict(arrowstyle="->", lw=2))
        
    output_path = os.path.join(FIGURES_DIR, 'model_architecture_diagram.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"Saved Architecture Diagram to {output_path}")
    plt.close()

if __name__ == "__main__":
    df, features = generate_synthetic_data()
    train_and_plot_roc(df, features)
    plot_model_architecture()
