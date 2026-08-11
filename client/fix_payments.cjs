const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'payments');
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isFile() && (file.endsWith('.jsx') || file.endsWith('.js'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let orig = content;

      content = content.replace(/from (["'])\.\.\/DataTable(["'])/g, 'from $1../common/DataTable$2');
      content = content.replace(/from (["'])\.\.\/AddStudentFeeModal(["'])/g, 'from $1../modals/AddStudentFeeModal$2');
 
      if (content !== orig) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed payments import in:', file);
      }
    }
  });
}
