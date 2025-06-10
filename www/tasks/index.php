<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مدير المهام - MyDevBox</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .main {
            padding: 2rem;
        }
        .add-task {
            background: #00b894;
            color: white;
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            text-align: center;
        }
        .add-task input {
            width: 70%;
            padding: 0.8rem;
            border: none;
            border-radius: 5px;
            margin-left: 10px;
            font-size: 1rem;
        }
        .add-task button {
            padding: 0.8rem 1.5rem;
            background: #00a085;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
        }
        .task-list {
            display: grid;
            gap: 1rem;
        }
        .task {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-right: 4px solid #74b9ff;
        }
        .task.completed {
            opacity: 0.7;
            text-decoration: line-through;
            border-right-color: #00b894;
        }
        .task-actions {
            display: flex;
            gap: 0.5rem;
        }
        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        .btn-complete {
            background: #00b894;
            color: white;
        }
        .btn-delete {
            background: #e74c3c;
            color: white;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #2d3436;
        }
        .stat-label {
            color: #636e72;
            margin-top: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
                 <div class="header">
             <h1>📋 مدير المهام</h1>
             <p>تطبيق بسيط لإدارة المهام اليومية</p>
             <p><small>🌐 الدومين المحلي: <strong>tasks.test</strong></small></p>
             <p><small>وقت الخادم: <?php echo date('Y-m-d H:i:s'); ?></small></p>
         </div>
        
        <div class="main">
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">5</div>
                    <div class="stat-label">المهام الكلية</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">3</div>
                    <div class="stat-label">المهام المكتملة</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">2</div>
                    <div class="stat-label">المهام المتبقية</div>
                </div>
            </div>
            
            <div class="add-task">
                <h3>إضافة مهمة جديدة</h3>
                <form style="margin-top: 1rem;">
                    <input type="text" placeholder="اكتب المهمة هنا..." required>
                    <button type="submit">إضافة</button>
                </form>
            </div>
            
            <div class="task-list">
                <div class="task completed">
                    <div>
                        <h4>تطوير واجهة المستخدم</h4>
                        <small>تم إنشاؤها منذ 3 أيام</small>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-complete">تراجع</button>
                        <button class="btn btn-delete">حذف</button>
                    </div>
                </div>
                
                <div class="task">
                    <div>
                        <h4>اختبار الوظائف الجديدة</h4>
                        <small>تم إنشاؤها منذ يومين</small>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-complete">اكتمل</button>
                        <button class="btn btn-delete">حذف</button>
                    </div>
                </div>
                
                <div class="task completed">
                    <div>
                        <h4>كتابة التوثيق</h4>
                        <small>تم إنشاؤها منذ أسبوع</small>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-complete">تراجع</button>
                        <button class="btn btn-delete">حذف</button>
                    </div>
                </div>
                
                <div class="task">
                    <div>
                        <h4>تحسين الأداء</h4>
                        <small>تم إنشاؤها اليوم</small>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-complete">اكتمل</button>
                        <button class="btn btn-delete">حذف</button>
                    </div>
                </div>
                
                <div class="task completed">
                    <div>
                        <h4>إعداد قاعدة البيانات</h4>
                        <small>تم إنشاؤها منذ 5 أيام</small>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-complete">تراجع</button>
                        <button class="btn btn-delete">حذف</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // محاكاة وظائف JavaScript
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.querySelector('form');
            const taskList = document.querySelector('.task-list');
            
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const input = this.querySelector('input');
                if (input.value.trim()) {
                    alert('تم إضافة المهمة: ' + input.value);
                    input.value = '';
                }
            });
            
            taskList.addEventListener('click', function(e) {
                if (e.target.classList.contains('btn-complete')) {
                    const task = e.target.closest('.task');
                    task.classList.toggle('completed');
                    e.target.textContent = task.classList.contains('completed') ? 'تراجع' : 'اكتمل';
                }
                
                if (e.target.classList.contains('btn-delete')) {
                    if (confirm('هل تريد حذف هذه المهمة؟')) {
                        e.target.closest('.task').remove();
                    }
                }
            });
        });
    </script>
</body>
</html> 