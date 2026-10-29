import { useEffect, useState } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3333').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = 'Não foi possível concluir a operação.';
    try {
      const body = await response.json();
      if (body.message) message = body.message;
    } catch {
      // Algumas respostas, como a de exclusão, não têm corpo JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

function isCompleted(task) {
  return task.completed === true || task.completed === 1;
}

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return '';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function TaskModal({ task, onClose, onSave, saving }) {
  const [title, setTitle] = useState(task?.title || '');
  const [dueDate, setDueDate] = useState(task?.due_date?.slice(0, 10) || '');

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    await onSave({
      title: cleanTitle,
      dueDate: dueDate || null,
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section
        aria-labelledby="modal-title"
        aria-modal="true"
        className="modal"
        role="dialog"
      >
        <h2 id="modal-title">{task ? 'Editar tarefa' : 'Nova tarefa'}</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="task-title">Título</label>
          <input
            autoFocus
            id="task-title"
            maxLength="255"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex.: estudar para a prova"
            required
            value={title}
          />

          <label htmlFor="task-date">Data de vencimento (opcional)</label>
          <input
            id="task-date"
            onChange={(event) => setDueDate(event.target.value)}
            type="date"
            value={dueDate}
          />

          <div className="modal-actions">
            <button className="button button-muted" disabled={saving} onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="button button-primary" disabled={saving || !title.trim()} type="submit">
              {saving ? 'Salvando...' : 'Salvar tarefa'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalTask, setModalTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ search: debouncedSearch, status });
      try {
        const data = await request(`/api/tasks?${params}`, { signal: controller.signal });
        setTasks(data.tasks);
        setTotal(Number(data.total) || 0);
        setCompletedCount(Number(data.completed) || 0);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(`Não foi possível conectar à API. ${loadError.message}`);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadTasks();
    return () => controller.abort();
  }, [debouncedSearch, status]);

  async function saveTask(values) {
    setSaving(true);
    setError('');
    try {
      const editing = modalTask !== null;
      const body = editing
        ? values
        : { title: values.title, ...(values.dueDate ? { dueDate: values.dueDate } : {}) };
      await request(editing ? `/api/tasks/${modalTask.id}` : '/api/tasks', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      setModalOpen(false);
      setModalTask(null);
      await refreshTasks();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function refreshTasks() {
    const params = new URLSearchParams({ search: debouncedSearch, status });
    const data = await request(`/api/tasks?${params}`);
    setTasks(data.tasks);
    setTotal(Number(data.total) || 0);
    setCompletedCount(Number(data.completed) || 0);
  }

  async function toggleTask(task) {
    setError('');
    try {
      await request(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !isCompleted(task) }),
      });
      await refreshTasks();
    } catch (toggleError) {
      setError(toggleError.message);
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return;
    setError('');
    try {
      await request(`/api/tasks/${task.id}`, { method: 'DELETE' });
      await refreshTasks();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function openModal(task = null) {
    setModalTask(task);
    setModalOpen(true);
    setError('');
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">ORGANIZE SEU DIA</p>
          <h1>Minhas tarefas</h1>
          <p className="subtitle">Um passo de cada vez. Você consegue!</p>
        </div>
        <button className="button button-primary add-button" onClick={() => openModal()} type="button">
          <span aria-hidden="true">+</span> Adicionar tarefa
        </button>
      </header>

      <section aria-label="Resumo das tarefas" className="summary">
        <article className="summary-card">
          <span className="summary-icon total-icon" aria-hidden="true">✓</span>
          <div><p>Total de tarefas</p><strong>{total}</strong></div>
        </article>
        <article className="summary-card">
          <span className="summary-icon done-icon" aria-hidden="true">★</span>
          <div><p>Concluídas</p><strong>{completedCount}</strong></div>
        </article>
      </section>

      <section aria-label="Lista de tarefas" className="task-section">
        <div className="list-heading">
          <div>
            <h2>Suas tarefas</h2>
            <p>{Math.max(total - completedCount, 0)} pendentes para fazer</p>
          </div>
          <div className="filters" aria-label="Filtrar tarefas">
            {[
              ['all', 'Todas'],
              ['pending', 'Pendentes'],
              ['completed', 'Concluídas'],
            ].map(([value, label]) => (
              <button
                aria-pressed={status === value}
                className={`filter-button ${status === value ? 'selected' : ''}`}
                key={value}
                onClick={() => setStatus(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Pesquisar tarefas"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar tarefas..."
            type="search"
            value={search}
          />
        </label>

        {error && <p className="error-message" role="alert">{error}</p>}

        {loading ? (
          <p aria-live="polite" className="feedback">Carregando tarefas...</p>
        ) : error && tasks.length === 0 ? null : tasks.length === 0 ? (
          <div className="empty-state">
            <span aria-hidden="true">☑</span>
            <h3>{total === 0 ? 'Você ainda não tem tarefas' : 'Nenhuma tarefa encontrada'}</h3>
            <p>{total === 0 ? 'Adicione uma tarefa para começar.' : 'Tente mudar a pesquisa ou o filtro.'}</p>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => {
              const done = isCompleted(task);
              const late = !done && task.due_date && task.due_date.slice(0, 10) < getToday();
              return (
                <li className="task-card" key={task.id}>
                  <input
                    aria-label={`Marcar "${task.title}" como ${done ? 'pendente' : 'concluída'}`}
                    checked={done}
                    className="task-checkbox"
                    onChange={() => toggleTask(task)}
                    type="checkbox"
                  />
                  <div className="task-content">
                    <p className={`task-title ${done ? 'completed' : ''} ${late ? 'late' : ''}`}>
                      {task.title}
                    </p>
                    <div className="task-details">
                      {task.due_date && <span>Vence em {formatDate(task.due_date)}</span>}
                      {late && <span className="late-label">Em atraso</span>}
                      {done && <span className="done-label">Concluída</span>}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button aria-label={`Editar ${task.title}`} onClick={() => openModal(task)} type="button">Editar</button>
                    <button aria-label={`Excluir ${task.title}`} className="delete-action" onClick={() => deleteTask(task)} type="button">Excluir</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {modalOpen && (
        <TaskModal
          onClose={() => {
            setModalOpen(false);
            setModalTask(null);
          }}
          onSave={saveTask}
          saving={saving}
          task={modalTask}
        />
      )}
    </main>
  );
}

export default App;
