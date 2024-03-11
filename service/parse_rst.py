
import sys
from docutils.core import publish_string
 
# 读取 RST 文件内容
with open(sys.argv[1], 'r') as file:
    rst_content = file.read()
 
# 解析 RST 并输出 HTML
html_output = publish_string(rst_content, writer_name='html')
 
# 打印 HTML 输出
print(html_output)