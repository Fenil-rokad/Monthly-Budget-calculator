// Budget Logic Module
const calcCtrl = (function () {
  const Income = function (id, desc, value) {
    this.id = id;
    this.desc = desc;
    this.value = value;
  };

  const Expense = function (id, desc, value) {
    this.id = id;
    this.desc = desc;
    this.value = value;
    this.percent = -1;
  };

  Expense.prototype.calcPercent = function (totalIncome) {
    this.percent = totalIncome > 0 ? Math.round((this.value / totalIncome) * 100) : -1;
  };

  Expense.prototype.getPercent = function () {
    return this.percent;
  };

  const data = {
    items: { income: [], expense: [] },
    totals: { income: 0, expense: 0 },
    budget: 0,
    percent: -1,
  };

  function calculateTotal(type) {
    data.totals[type] = data.items[type].reduce((sum, item) => sum + item.value, 0);
  }

  return {
    addItem: function (type, desc, val) {
      let ID = data.items[type].length ? data.items[type][data.items[type].length - 1].id + 1 : 0;
      const newItem = type === "income" ? new Income(ID, desc, val) : new Expense(ID, desc, val);
      data.items[type].push(newItem);
      return newItem;
    },

    deleteItem: function (type, id) {
      const index = data.items[type].findIndex(item => item.id === id);
      if (index !== -1) data.items[type].splice(index, 1);
    },

    calculateBudget: function () {
      calculateTotal("income");
      calculateTotal("expense");
      data.budget = data.totals.income - data.totals.expense;
      data.percent = data.totals.income > 0
        ? Math.round((data.totals.expense / data.totals.income) * 100)
        : -1;
    },

    getBudget: function () {
      return {
        budget: data.budget,
        totalInc: data.totals.income,
        totalExp: data.totals.expense,
        percent: data.percent
      };
    },

    calculatePercentages: function () {
      data.items.expense.forEach(exp => exp.calcPercent(data.totals.income));
    },

    getPercentages: function () {
      return data.items.expense.map(exp => exp.getPercent());
    }
  };
})();

// UI Controller
const UICtrl = (function () {
  const DOM = {
    type: ".in-out",
    desc: ".desc",
    value: ".value",
    addBtn: ".add",
    budget: ".head1",
    income: ".in",
    expense: ".ex",
    incomeList: ".income_list",
    expenseList: ".expense_list",
    container: ".bottom",
    date: ".date"
  };

  function formatNumber(num, type) {
    let sign = type === "expense" ? "-" : "+";
    num = Math.abs(num).toFixed(2);
    let [int, dec] = num.split(".");
    if (int.length > 3) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${sign}${int}.${dec}`;
  }

  return {
    getInput: function () {
      return {
        type: document.querySelector(DOM.type).value,
        desc: document.querySelector(DOM.desc).value,
        value: parseFloat(document.querySelector(DOM.value).value)
      };
    },

    addListItem: function (obj, type, percent) {
      const html = type === "income"
        ? `<div class="item" id="income-${obj.id}">
            <div class="item_desc">${obj.desc}</div>
            <div class="item_value">${formatNumber(obj.value, type)}</div>
            <div class="item_delete"><button class="delete-btn"><img src="delete.png" alt="Delete" /></button></div>
          </div>`
        : `<div class="item" id="expense-${obj.id}">
            <div class="item_desc">${obj.desc}</div>
            <div class="item_value">${formatNumber(obj.value, type)}</div>
            <div class="item_per">${percent}%</div>
            <div class="item_delete"><button class="delete-btn"><img src="delete.png" alt="Delete" /></button></div>
          </div>`;
      document.querySelector(type === "income" ? DOM.incomeList : DOM.expenseList)
        .insertAdjacentHTML("beforeend", html);
    },

    clearFields: function () {
      document.querySelector(DOM.desc).value = "";
      document.querySelector(DOM.value).value = "";
      document.querySelector(DOM.desc).focus();
    },

    updateBudget: function (obj) {
      document.querySelector(DOM.budget).textContent = formatNumber(obj.budget, obj.budget >= 0 ? "income" : "expense");
      document.querySelector(DOM.income).textContent = formatNumber(obj.totalInc, "income");
      document.querySelector(DOM.expense).textContent = formatNumber(obj.totalExp, "expense");
    },

    deleteItem: function (selectorID) {
      const el = document.getElementById(selectorID);
      if (el) el.remove();
    },

    displayDate: function () {
      const now = new Date();
      const months = ["January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"];
      document.querySelector(DOM.date).textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;
    },

    getDOM: function () {
      return DOM;
    }
  };
})();

// App Controller
const controller = (function (budgetCtrl, UICtrl) {
  const setupEventListeners = function () {
    const DOM = UICtrl.getDOM();

    document.querySelector(DOM.addBtn).addEventListener("click", ctrlAddItem);
    document.addEventListener("keypress", function (e) {
      if (e.key === "Enter") ctrlAddItem();
    });

    document.querySelector(DOM.container).addEventListener("click", ctrlDeleteItem);
  };

  function ctrlAddItem() {
    const input = UICtrl.getInput();

    if (input.desc !== "" && !isNaN(input.value) && input.value > 0) {
      const newItem = budgetCtrl.addItem(input.type, input.desc, input.value);
      budgetCtrl.calculateBudget();
      const budget = budgetCtrl.getBudget();

      if (input.type === "expense") {
        budgetCtrl.calculatePercentages();
        const percentages = budgetCtrl.getPercentages();
        UICtrl.addListItem(newItem, input.type, percentages.at(-1));
      } else {
        UICtrl.addListItem(newItem, input.type);
      }

      UICtrl.clearFields();
      UICtrl.updateBudget(budget);
    }
  }

  function ctrlDeleteItem(e) {
    const itemID = e.target.closest(".item")?.id;
    if (itemID) {
      const [type, id] = itemID.split("-");
      budgetCtrl.deleteItem(type, parseInt(id));
      UICtrl.deleteItem(itemID);
      budgetCtrl.calculateBudget();
      UICtrl.updateBudget(budgetCtrl.getBudget());
    }
  }

  return {
    init: function () {
      console.log("App Started");
      UICtrl.displayDate();
      UICtrl.updateBudget({ budget: 0, totalInc: 0, totalExp: 0 });
      setupEventListeners();
    }
  };
})(calcCtrl, UICtrl);

// Start the App
controller.init();
