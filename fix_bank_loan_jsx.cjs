const fs = require('fs');
const file = 'client/src/pages/BankLoanHistory.jsx';
let content = fs.readFileSync(file, 'utf8');

// I will split it by "          )}\n        </div>" and take the first match! Then append the closing braces.
const delimiter = "          )}\n        </div>";
const parts = content.split(delimiter);

if (parts.length > 1) {
    // Only take the first part which is everything up to the first closing div of the table logic.
    let newContent = parts[0] + delimiter + `
      </div>
    </div>
  );
};

export default BankLoanHistory;
`;
    fs.writeFileSync(file, newContent);
    console.log("Fixed JSX parse error cleanly.");
} else {
    console.log("Delimiter not found");
}
