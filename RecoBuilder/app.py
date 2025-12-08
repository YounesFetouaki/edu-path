from flask import Flask, request, jsonify
import recommender

app = Flask(__name__)

@app.route('/recommend', methods=['POST'])
def get_recommendations():
    try:
        data = request.json
        # Input: {"query": "I am struggling with SQL"} or {"student_id": 1}
        # Ideally we fetch student profile. For now, simple query based.
        
        query = data.get('query', '')
        if not query and 'student_id' in data:
            # TODO: Fetch student weak spot from DB. Mocking:
            query = "Machine Learning Basics" 
            
        results = recommender.recommend(query)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Build index on start
    recommender.load_index()
    app.run(port=5004)
