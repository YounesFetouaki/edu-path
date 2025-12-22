import 'package:flutter/material.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // Local state for profile data
  String _name = 'Alex Student';
  String _major = 'Computer Science Major';
  bool _notificationsEnabled = true;

  void _showEditProfileDialog() {
    final nameController = TextEditingController(text: _name);
    final majorController = TextEditingController(text: _major);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Profile'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Full Name'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: majorController,
              decoration: const InputDecoration(labelText: 'Major / Title'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _name = nameController.text;
                _major = majorController.text;
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Profile updated successfully!')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _handleLogout() {
    // Navigate to Login Screen and remove all previous routes
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        const Center(
          child: CircleAvatar(
            radius: 50,
            backgroundImage: NetworkImage(
              'https://i.pravatar.cc/150?img=12',
            ), // Mock image
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: Text(
            _name,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
        ),
        Center(
          child: Text(
            _major,
            style: const TextStyle(color: Colors.grey, fontSize: 16),
          ),
        ),
        const SizedBox(height: 32),
        _buildStatCard(
          'Courses Completed',
          '3',
          Icons.check_circle_outline,
          Colors.green,
        ),
        _buildStatCard(
          'Hours Learned',
          '42',
          Icons.timer_outlined,
          Colors.blue,
        ),
        _buildStatCard(
          'Average Score',
          '88%',
          Icons.grade_outlined,
          Colors.orange,
        ),
        const SizedBox(height: 32),
        const Text(
          'Settings',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        ListTile(
          leading: const Icon(Icons.person_outline),
          title: const Text('Edit Profile'),
          trailing: const Icon(Icons.chevron_right),
          onTap: _showEditProfileDialog,
        ),
        ListTile(
          leading: const Icon(Icons.notifications_outlined),
          title: const Text('Notifications'),
          trailing: Switch(
            value: _notificationsEnabled,
            onChanged: (v) {
              setState(() => _notificationsEnabled = v);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    v ? 'Notifications Enabled' : 'Notifications Disabled',
                  ),
                ),
              );
            },
          ),
        ),
        ListTile(
          leading: const Icon(Icons.logout, color: Colors.red),
          title: const Text('Logout', style: TextStyle(color: Colors.red)),
          onTap: _handleLogout,
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 32),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(title, style: const TextStyle(color: Colors.grey)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
