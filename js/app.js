/*
 * Personal Dashboard application logic.
 * One namespaced file: Storage, Greeting (custom name), Timer (custom duration),
 * Todo, Links, Theme, and the App controller that starts everything.
 */
(function () {
  'use strict';

  var KEYS = {
    tasks: 'dashboard.tasks',
    links: 'dashboard.links',
    name: 'dashboard.name',
    duration: 'dashboard.duration',
    theme: 'dashboard.theme',
    sort: 'dashboard.sort'
  };

  /* ---------- Helpers ---------- */

  function $(id) {
    return document.getElementById(id);
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function showError(el, message) {
    el.textContent = message;
    el.hidden = false;
  }

  function clearError(el) {
    el.textContent = '';
    el.hidden = true;
  }

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* ---------- Storage ---------- */

  var Storage = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  /* ---------- Greeting ---------- */

  var Greeting = {
    name: '',

    init: function () {
      var self = this;
      this.name = Storage.get(KEYS.name, '');
      $('name-input').value = this.name;

      $('name-form').addEventListener('submit', function (e) {
        e.preventDefault();
        self.name = $('name-input').value.trim();
        Storage.set(KEYS.name, self.name);
        self.render();
      });

      this.render();
      setInterval(function () { self.render(); }, 1000);
    },

    greetingFor: function (hour) {
      if (hour >= 5 && hour < 12) return 'Good morning';
      if (hour >= 12 && hour < 18) return 'Good afternoon';
      if (hour >= 18 && hour < 22) return 'Good evening';
      return 'Good night';
    },

    render: function () {
      var now = new Date();
      $('current-time').textContent =
        pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
      $('current-date').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      var text = this.greetingFor(now.getHours());
      $('greeting-text').textContent = this.name ? text + ', ' + this.name : text;
    }
  };

  /* ---------- Focus timer ---------- */

  var Timer = {
    minutes: 25,
    remainingMs: 25 * 60 * 1000,
    endAt: 0,
    handle: null,

    init: function () {
      var self = this;
      var saved = Number(Storage.get(KEYS.duration, 25));
      this.minutes = this.isValid(saved) ? saved : 25;
      this.remainingMs = this.minutes * 60 * 1000;
      $('duration-input').value = this.minutes;

      $('timer-start').addEventListener('click', function () { self.start(); });
      $('timer-stop').addEventListener('click', function () { self.stop(); });
      $('timer-reset').addEventListener('click', function () { self.reset(); });

      $('duration-form').addEventListener('submit', function (e) {
        e.preventDefault();
        self.setDuration($('duration-input').value);
      });

      this.render();
    },

    isValid: function (value) {
      return Number.isInteger(value) && value >= 1 && value <= 180;
    },

    setStatus: function (text) {
      $('timer-status').textContent = text;
    },

    start: function () {
      var self = this;
      if (this.handle) return;
      if (this.remainingMs <= 0) this.remainingMs = this.minutes * 60 * 1000;
      this.endAt = Date.now() + this.remainingMs;
      this.handle = setInterval(function () { self.tick(); }, 250);
      this.setStatus('Focusing...');
    },

    stop: function () {
      if (!this.handle) return;
      clearInterval(this.handle);
      this.handle = null;
      this.remainingMs = Math.max(0, this.endAt - Date.now());
      this.setStatus('Paused');
      this.render();
    },

    reset: function () {
      clearInterval(this.handle);
      this.handle = null;
      this.remainingMs = this.minutes * 60 * 1000;
      this.setStatus('');
      this.render();
    },

    tick: function () {
      this.remainingMs = this.endAt - Date.now();
      if (this.remainingMs <= 0) {
        clearInterval(this.handle);
        this.handle = null;
        this.remainingMs = 0;
        this.setStatus('Time is up. Take a short break.');
      }
      this.render();
    },

    setDuration: function (raw) {
      var errorEl = $('duration-error');
      var value = Number(raw);
      if (!this.isValid(value)) {
        showError(errorEl, 'Enter a whole number from 1 to 180.');
        return;
      }
      clearError(errorEl);
      this.minutes = value;
      Storage.set(KEYS.duration, value);
      this.reset();
    },

    render: function () {
      var totalSeconds = Math.ceil(this.remainingMs / 1000);
      var m = Math.floor(totalSeconds / 60);
      var s = totalSeconds % 60;
      $('timer-display').textContent = pad(m) + ':' + pad(s);
    }
  };

  /* ---------- To-do list ---------- */

  var Todo = {
    tasks: [],
    editingId: null,
    sortMode: 'added',

    init: function () {
      var self = this;
      var saved = Storage.get(KEYS.tasks, []);
      this.tasks = Array.isArray(saved) ? saved : [];

      var savedSort = Storage.get(KEYS.sort, 'added');
      var allowed = ['added', 'newest', 'az', 'za', 'pending'];
      this.sortMode = allowed.indexOf(savedSort) !== -1 ? savedSort : 'added';
      $('todo-sort').value = this.sortMode;

      $('todo-sort').addEventListener('change', function (e) {
        self.sortMode = e.target.value;
        Storage.set(KEYS.sort, self.sortMode);
        self.render();
      });

      $('todo-form').addEventListener('submit', function (e) {
        e.preventDefault();
        self.add($('todo-input').value);
      });

      var list = $('todo-list');

      list.addEventListener('click', function (e) {
        var target = e.target.closest('[data-action]');
        if (!target) return;
        var id = target.getAttribute('data-id');
        var action = target.getAttribute('data-action');
        if (action === 'delete') self.remove(id);
        if (action === 'edit') self.startEdit(id);
        if (action === 'cancel') self.cancelEdit();
      });

      list.addEventListener('change', function (e) {
        if (e.target.matches('input[type="checkbox"]')) {
          self.toggle(e.target.getAttribute('data-id'));
        }
      });

      list.addEventListener('submit', function (e) {
        e.preventDefault();
        var form = e.target;
        self.saveEdit(form.getAttribute('data-id'), form.elements.text.value);
      });

      list.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.editingId) self.cancelEdit();
      });

      this.render();
    },

    save: function () {
      Storage.set(KEYS.tasks, this.tasks);
    },

    add: function (raw) {
      var text = raw.trim();
      var errorEl = $('todo-error');
      if (!text) {
        showError(errorEl, 'Write a task before adding it.');
        return;
      }
      clearError(errorEl);
      this.tasks.push({ id: uid(), text: text, done: false });
      $('todo-input').value = '';
      this.save();
      this.render();
    },

    toggle: function (id) {
      this.tasks.forEach(function (t) {
        if (t.id === id) t.done = !t.done;
      });
      this.save();
      this.render();
    },

    remove: function (id) {
      this.tasks = this.tasks.filter(function (t) { return t.id !== id; });
      if (this.editingId === id) this.editingId = null;
      this.save();
      this.render();
    },

    startEdit: function (id) {
      this.editingId = id;
      this.render();
      var input = $('todo-list').querySelector('.edit-form input');
      if (input) input.focus();
    },

    cancelEdit: function () {
      this.editingId = null;
      this.render();
    },

    saveEdit: function (id, raw) {
      var text = raw.trim();
      if (!text) return;
      this.tasks.forEach(function (t) {
        if (t.id === id) t.text = text;
      });
      this.editingId = null;
      this.save();
      this.render();
    },

    // Returns a sorted copy so the saved order (order added) never changes.
    sortedTasks: function () {
      var copy = this.tasks.slice();
      var byText = function (a, b) {
        return a.text.localeCompare(b.text, undefined, { sensitivity: 'base' });
      };

      if (this.sortMode === 'newest') return copy.reverse();
      if (this.sortMode === 'az') return copy.sort(byText);
      if (this.sortMode === 'za') return copy.sort(function (a, b) { return byText(b, a); });
      if (this.sortMode === 'pending') {
        return copy.sort(function (a, b) { return Number(a.done) - Number(b.done); });
      }
      return copy;
    },

    buildItem: function (task) {
      var li = make('li', 'todo-item' + (task.done ? ' is-done' : ''));

      var checkbox = make('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.setAttribute('data-id', task.id);
      checkbox.setAttribute('aria-label', 'Mark "' + task.text + '" as done');
      li.appendChild(checkbox);

      if (this.editingId === task.id) {
        var form = make('form', 'edit-form');
        form.setAttribute('data-id', task.id);
        form.setAttribute('autocomplete', 'off');

        var input = make('input');
        input.type = 'text';
        input.name = 'text';
        input.maxLength = 120;
        input.value = task.text;
        input.setAttribute('aria-label', 'Edit task');
        form.appendChild(input);

        var save = make('button', 'btn btn-small', 'Save');
        save.type = 'submit';
        form.appendChild(save);

        var cancel = make('button', 'btn btn-small btn-quiet', 'Cancel');
        cancel.type = 'button';
        cancel.setAttribute('data-action', 'cancel');
        form.appendChild(cancel);

        li.appendChild(form);
      } else {
        li.appendChild(make('span', 'todo-text', task.text));

        var edit = make('button', 'btn btn-small btn-quiet', 'Edit');
        edit.type = 'button';
        edit.setAttribute('data-action', 'edit');
        edit.setAttribute('data-id', task.id);
        li.appendChild(edit);

        var del = make('button', 'btn btn-small btn-danger', 'Delete');
        del.type = 'button';
        del.setAttribute('data-action', 'delete');
        del.setAttribute('data-id', task.id);
        li.appendChild(del);
      }

      return li;
    },

    render: function () {
      var list = $('todo-list');
      var self = this;
      list.textContent = '';
      this.sortedTasks().forEach(function (task) {
        list.appendChild(self.buildItem(task));
      });
      $('todo-empty').hidden = this.tasks.length > 0;
    }
  };

  /* ---------- Quick links ---------- */

  var Links = {
    links: [],

    init: function () {
      var self = this;
      var saved = Storage.get(KEYS.links, []);
      this.links = Array.isArray(saved) ? saved : [];

      $('link-form').addEventListener('submit', function (e) {
        e.preventDefault();
        self.add($('link-label').value, $('link-url').value);
      });

      $('link-list').addEventListener('click', function (e) {
        var target = e.target.closest('[data-action="remove"]');
        if (target) self.remove(target.getAttribute('data-id'));
      });

      this.render();
    },

    save: function () {
      Storage.set(KEYS.links, this.links);
    },

    isSafeUrl: function (value) {
      try {
        var protocol = new URL(value).protocol;
        return protocol === 'http:' || protocol === 'https:';
      } catch (e) {
        return false;
      }
    },

    add: function (rawLabel, rawUrl) {
      var label = rawLabel.trim();
      var url = rawUrl.trim();
      var errorEl = $('link-error');

      if (!label || !url) {
        showError(errorEl, 'Enter both a name and a URL.');
        return;
      }
      if (!this.isSafeUrl(url)) {
        showError(errorEl, 'Enter a full web address that starts with http:// or https://');
        return;
      }
      clearError(errorEl);
      this.links.push({ id: uid(), label: label, url: url });
      $('link-label').value = '';
      $('link-url').value = '';
      this.save();
      this.render();
    },

    remove: function (id) {
      this.links = this.links.filter(function (l) { return l.id !== id; });
      this.save();
      this.render();
    },

    render: function () {
      var list = $('link-list');
      list.textContent = '';

      this.links.forEach(function (link) {
        var li = make('li', 'link-item');

        var anchor = make('a', 'link-btn', link.label);
        anchor.href = link.url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        li.appendChild(anchor);

        var remove = make('button', 'link-remove', '\u00d7');
        remove.type = 'button';
        remove.setAttribute('data-action', 'remove');
        remove.setAttribute('data-id', link.id);
        remove.setAttribute('aria-label', 'Remove ' + link.label);
        li.appendChild(remove);

        list.appendChild(li);
      });

      $('link-empty').hidden = this.links.length > 0;
    }
  };

  /* ---------- Theme ---------- */

  var Theme = {
    current: 'light',

    init: function () {
      var self = this;
      var saved = Storage.get(KEYS.theme, null);
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.apply(saved === 'dark' || saved === 'light' ? saved : (prefersDark ? 'dark' : 'light'));

      $('theme-toggle').addEventListener('click', function () {
        var next = self.current === 'dark' ? 'light' : 'dark';
        self.apply(next);
        Storage.set(KEYS.theme, next);
      });
    },

    apply: function (theme) {
      this.current = theme;
      document.documentElement.setAttribute('data-theme', theme);
      var button = $('theme-toggle');
      button.textContent = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  };

  /* ---------- App controller ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    Theme.init();
    Greeting.init();
    Timer.init();
    Todo.init();
    Links.init();
  });
})();