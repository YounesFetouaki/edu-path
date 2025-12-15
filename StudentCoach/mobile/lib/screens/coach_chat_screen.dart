import 'package:flutter/material.dart';
import '../services/data_service.dart';

class CoachChatScreen extends StatefulWidget {
  const CoachChatScreen({super.key});

  @override
  State<CoachChatScreen> createState() => _CoachChatScreenState();
}

class _CoachChatScreenState extends State<CoachChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<Map<String, dynamic>> _messages = [
    {'text': 'Hello Alex! I am your AI Coach. I noticed you are struggling with Neural Networks. Do you want to review?', 'isUser': false},
  ];
  final DataService _dataService = DataService();
  bool _isQuizMode = false;
  List<dynamic> _currentQuiz = [];
  int _currentQuestionIndex = 0;

  void _sendMessage(String text) async {
    if (text.isEmpty) return;
    setState(() {
      _messages.add({'text': text, 'isUser': true});
    });
    _controller.clear();

    // Check for local commands first
    if (text.toLowerCase().contains('start quiz')) {
        // Try to extract topic from recent context or command
        // E.g., "Start quiz on Python"
        String topic = 'General';
        if (text.toLowerCase().contains('on ')) {
            topic = text.split('on ')[1].trim();
        } else {
            // Default to Neural Networks if no context (Demo)
            topic = 'Neural Networks';
        }
        _startQuiz(topic);
        return;
    }
    
    if (text.toLowerCase().contains('quiz') && !text.toLowerCase().contains('start')) {
         setState(() {
           _messages.add({'text': 'Do you want to start a quiz? Say "Start Quiz on [Topic]"!', 'isUser': false});
         });
         return;
    }

    // Call Backend
    try {
        setState(() => _messages.add({'text': '...', 'isUser': false, 'loading': true})); // Typing indicator
        
        final response = await _dataService.sendChatMessage(text);
        
        setState(() {
            _messages.removeWhere((m) => m['loading'] == true);
            _messages.add({'text': response, 'isUser': false});
        });
    } catch (e) {
        setState(() {
            _messages.removeWhere((m) => m['loading'] == true);
             _messages.add({'text': 'Coach is offline. Try checking your connection.', 'isUser': false});
        });
    }
  }

  Future<void> _startQuiz(String topic) async {
    setState(() {
      _messages.add({'text': 'Generating a quiz on $topic... 🤖', 'isUser': false});
    });
    
    try {
      final quiz = await _dataService.generateQuiz(topic);
      setState(() {
        _isQuizMode = true;
        _currentQuiz = quiz;
        _currentQuestionIndex = 0;
        _messages.add({'text': 'Quiz Ready! Question 1:', 'isUser': false});
      });
    } catch (e) {
      setState(() {
        _messages.add({'text': 'Failed to generate quiz. Try again.', 'isUser': false});
      });
    }
  }

  void _handleAnswer(int optionIndex) {
    final question = _currentQuiz[_currentQuestionIndex];
    final isCorrect = optionIndex == question['correct'];
    
    setState(() {
      _messages.add({
        'text': isCorrect ? '✅ Correct!' : '❌ Incorrect. The answer was ${question['options'][question['correct']]}', 
        'isUser': false
      });
      
      if (_currentQuestionIndex < _currentQuiz.length - 1) {
        _currentQuestionIndex++;
        // Trigger next question
      } else {
        _isQuizMode = false;
        _messages.add({'text': '🎉 Quiz Complete! Great job!', 'isUser': false});
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length + (_isQuizMode ? 1 : 0),
            itemBuilder: (context, index) {
              if (_isQuizMode && index == _messages.length) {
                // Render Current Quiz Question
                final q = _currentQuiz[_currentQuestionIndex];
                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  color: Colors.blue.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Question ${_currentQuestionIndex + 1}: ${q['question']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        ...List.generate(q['options'].length, (i) => 
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: ElevatedButton(
                              onPressed: () => _handleAnswer(i),
                              child: Text(q['options'][i]),
                            ),
                          )
                        )
                      ],
                    ),
                  ),
                );
              }

              final msg = _messages[index];
              final isUser = msg['isUser'];
              return Align(
                alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isUser ? Colors.blue : Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    msg['text'],
                    style: TextStyle(color: isUser ? Colors.white : Colors.black),
                  ),
                ),
              );
            },
          ),
        ),
        if (!_isQuizMode)
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'Ask your coach...',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: _sendMessage,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send),
                  color: Colors.blue,
                  onPressed: () => _sendMessage(_controller.text),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
