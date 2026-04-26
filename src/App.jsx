import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const emptyJobForm = {
  title: '',
  salary: '',
  location: '',
  type: 'Full-time',
}

const pageSize = 5

export function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error(error)
      }

      if (isMounted) {
        setSession(data.session ?? null)
        setAuthLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      startTransition(() => {
        setSession(nextSession)
        setAuthLoading(false)
      })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (!isSupabaseConfigured) {
    return <SetupScreen />
  }

  if (authLoading) {
    return <LoadingScreen label="Checking your session..." />
  }

  return session ? (
    <Dashboard session={session} />
  ) : (
    <LoginScreen onAuthenticated={setSession} />
  )
}

function SectionIcon({ type }) {
  if (type === 'create') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  }

  if (type === 'saved') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 5h10a1 1 0 0 1 1 1v13l-6-3-6 3V6a1 1 0 0 1 1-1Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function ActionIcon({ type, active = false }) {
  if (type === 'edit') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20h4l10-10-4-4L4 16v4Z" />
        <path d="m12 6 4 4" />
      </svg>
    )
  }

  if (type === 'delete') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M6 7l1 12h10l1-12" />
        <path d="M9 7V4h6v3" />
      </svg>
    )
  }

  return active ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h10a1 1 0 0 1 1 1v13l-6-3-6 3V6a1 1 0 0 1 1-1Z" fill="currentColor" stroke="none" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h10a1 1 0 0 1 1 1v13l-6-3-6 3V6a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

function SetupScreen() {
  return (
    <main className="shell shell--centered">
      <section className="setup-card">
        <p className="eyebrow">Configuration Required</p>
        <h1>Connect Supabase before running the dashboard.</h1>
        <p className="muted">
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a local
          <code> .env </code>
          file using <code>.env.example</code> as the template.
        </p>
        <div className="setup-grid">
          <div>
            <span className="setup-label">Frontend</span>
            <p>Vite + React dashboard with auth, CRUD, search, pagination, validation, and toasts.</p>
          </div>
          <div>
            <span className="setup-label">Supabase</span>
            <p>
              Schema and row-level security setup live in <code>supabase/schema.sql</code>.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function LoadingScreen({ label }) {
  return (
    <main className="shell shell--centered">
      <section className="loading-card">
        <div className="spinner" aria-hidden="true" />
        <p>{label}</p>
      </section>
    </main>
  )
}

function LoginScreen({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (!supabase) {
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setIsSubmitting(false)
      return
    }

    onAuthenticated(data.session ?? null)
    setIsSubmitting(false)
  }

  return (
    <main className="shell shell--centered">
      <section className="auth-card">
        <div className="auth-copy">
          <p className="eyebrow">Job Listings Platform</p>
          <h1>Admin Dashboard</h1>
          <p className="muted">
            Manage listings, review saved jobs, and keep the hiring pipeline tidy from one place.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login to Dashboard'}
          </button>
        </form>
      </section>
    </main>
  )
}

function Dashboard({ session }) {
  const [view, setView] = useState('create')
  const [jobs, setJobs] = useState([])
  const [savedJobIds, setSavedJobIds] = useState([])
  const [jobForm, setJobForm] = useState(emptyJobForm)
  const [editingJobId, setEditingJobId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [locationFilter, setLocationFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [isSavingJob, setIsSavingJob] = useState(false)
  const [busyJobId, setBusyJobId] = useState(null)
  const [toast, setToast] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const deferredSearch = useDeferredValue(searchTerm)

  useEffect(() => {
    void loadDashboardData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [deferredSearch, typeFilter, locationFilter, view])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null)
    }, 2600)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [toast])

  async function loadDashboardData() {
    if (!supabase) {
      return
    }

    setIsLoadingJobs(true)

    const [jobsResponse, savedJobsResponse] = await Promise.all([
      supabase
        .from('jobs')
        .select('id, title, salary, location, type, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('saved_jobs').select('job_id').eq('user_id', session.user.id),
    ])

    if (jobsResponse.error) {
      notify(jobsResponse.error.message, 'error')
    } else {
      setJobs(jobsResponse.data ?? [])
    }

    if (savedJobsResponse.error) {
      notify(savedJobsResponse.error.message, 'error')
    } else {
      setSavedJobIds((savedJobsResponse.data ?? []).map((item) => item.job_id))
    }

    setIsLoadingJobs(false)
  }

  function notify(message, tone) {
    setToast({ message, tone })
  }

  function resetForm() {
    setEditingJobId(null)
    setJobForm(emptyJobForm)
    setFormErrors({})
  }

  function validateForm() {
    const nextErrors = {}

    if (!jobForm.title.trim()) {
      nextErrors.title = 'Title is required.'
    }

    const salaryNumber = Number(jobForm.salary)
    if (!jobForm.salary.trim()) {
      nextErrors.salary = 'Salary is required.'
    } else if (Number.isNaN(salaryNumber) || salaryNumber <= 0) {
      nextErrors.salary = 'Salary must be a positive number.'
    }

    if (!jobForm.location.trim()) {
      nextErrors.location = 'Location is required.'
    }

    if (!jobForm.type.trim()) {
      nextErrors.type = 'Type is required.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSaveJob(event) {
    event.preventDefault()

    if (!supabase || !validateForm()) {
      return
    }

    setIsSavingJob(true)

    const payload = {
      title: jobForm.title.trim(),
      salary: Number(jobForm.salary),
      location: jobForm.location.trim(),
      type: jobForm.type.trim(),
    }

    const response = editingJobId
      ? await supabase.from('jobs').update(payload).eq('id', editingJobId).select().single()
      : await supabase.from('jobs').insert(payload).select().single()

    if (response.error) {
      notify(response.error.message, 'error')
      setIsSavingJob(false)
      return
    }

    await loadDashboardData()
    const wasEditing = Boolean(editingJobId)
    resetForm()
    setIsSavingJob(false)
    notify(wasEditing ? 'Job updated successfully.' : 'Job created successfully.', 'success')
  }

  function handleEdit(job) {
    setEditingJobId(job.id)
    setJobForm({
      title: job.title,
      salary: String(job.salary),
      location: job.location,
      type: job.type,
    })
    setFormErrors({})
    setView('create')
  }

  async function handleDelete(job) {
    if (!supabase || !window.confirm(`Delete "${job.title}"?`)) {
      return
    }

    setBusyJobId(job.id)
    const { error } = await supabase.from('jobs').delete().eq('id', job.id)

    if (error) {
      notify(error.message, 'error')
      setBusyJobId(null)
      return
    }

    await loadDashboardData()
    if (editingJobId === job.id) {
      resetForm()
    }
    setBusyJobId(null)
    notify('Job deleted successfully.', 'success')
  }

  async function toggleSavedJob(jobId) {
    if (!supabase) {
      return
    }

    setBusyJobId(jobId)
    const isSaved = savedJobIds.includes(jobId)
    const response = isSaved
      ? await supabase.from('saved_jobs').delete().eq('user_id', session.user.id).eq('job_id', jobId)
      : await supabase.from('saved_jobs').insert({
          user_id: session.user.id,
          job_id: jobId,
        })

    if (response.error) {
      notify(response.error.message, 'error')
      setBusyJobId(null)
      return
    }

    setSavedJobIds((current) =>
      isSaved ? current.filter((currentJobId) => currentJobId !== jobId) : [...current, jobId],
    )
    setBusyJobId(null)
    notify(isSaved ? 'Removed from saved jobs.' : 'Saved job successfully.', 'success')
  }

  async function handleLogout() {
    if (!supabase) {
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      notify(error.message, 'error')
    }
  }

  const searchableJobs = view === 'saved' ? jobs.filter((job) => savedJobIds.includes(job.id)) : jobs
  const normalizedSearch = deferredSearch.trim().toLowerCase()
  const filteredJobs = searchableJobs.filter((job) => {
    const matchesSearch =
      !normalizedSearch ||
      [job.title, job.location, job.type].some((value) => value.toLowerCase().includes(normalizedSearch))

    const matchesType = typeFilter === 'All' || job.type === typeFilter
    const matchesLocation = locationFilter === 'All' || job.location === locationFilter

    return matchesSearch && matchesType && matchesLocation
  })

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedJobs = filteredJobs.slice((safePage - 1) * pageSize, safePage * pageSize)
  const jobTypes = ['All', ...new Set(jobs.map((job) => job.type))]
  const locations = ['All', ...new Set(jobs.map((job) => job.location))]
  const pageTitle =
    view === 'create'
      ? editingJobId
        ? 'Update an existing listing'
        : 'Create a new job listing'
      : view === 'jobs'
        ? 'Manage all created jobs'
        : 'Review saved jobs'
  const pageEyebrow =
    view === 'create' ? 'Create Job' : view === 'jobs' ? 'Created Jobs' : 'Saved Jobs'

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Admin Workspace</p>
          <h1>Talent Board</h1>
          <p className="sidebar-copy">{session.user.email}</p>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard sections">
          <button
            className={view === 'create' ? 'nav-button nav-button--active' : 'nav-button'}
            type="button"
            onClick={() => setView('create')}
          >
            <SectionIcon type="create" />
            Create Job
          </button>
          <button
            className={view === 'jobs' ? 'nav-button nav-button--active' : 'nav-button'}
            type="button"
            onClick={() => setView('jobs')}
          >
            <SectionIcon type="jobs" />
            Jobs
          </button>
          <button
            className={view === 'saved' ? 'nav-button nav-button--active' : 'nav-button'}
            type="button"
            onClick={() => setView('saved')}
          >
            <SectionIcon type="saved" />
            Saved Jobs
          </button>
        </nav>

        <button className="ghost-button" type="button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div className="workspace-title">
            <p className="eyebrow">{pageEyebrow}</p>
            <h2>{pageTitle}</h2>
          </div>
          <div className="stat-card">
            <span>{jobs.length}</span>
            <p>Total jobs</p>
          </div>
          <div className="stat-card">
            <span>{savedJobIds.length}</span>
            <p>Saved by current user</p>
          </div>
        </header>

        {view === 'create' ? (
          <section className="create-layout">
            <div className="panel panel--hero">
              <div className="panel-heading">
                <div>
                  <h3>{editingJobId ? 'Edit job' : 'Create job'}</h3>
                  <p>Publish a polished listing with the essentials candidates care about first.</p>
                </div>
                {editingJobId ? (
                  <button className="link-button" type="button" onClick={resetForm}>
                    Cancel edit
                  </button>
                ) : null}
              </div>

              <form className="job-form job-form--grid" onSubmit={handleSaveJob}>
                <label className="field field--wide">
                  <span>Title</span>
                  <input
                    type="text"
                    placeholder="Senior Product Designer"
                    value={jobForm.title}
                    onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })}
                  />
                  {formErrors.title ? <small>{formErrors.title}</small> : null}
                </label>

                <label className="field">
                  <span>Salary</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="120000"
                    value={jobForm.salary}
                    onChange={(event) => setJobForm({ ...jobForm, salary: event.target.value })}
                  />
                  {formErrors.salary ? <small>{formErrors.salary}</small> : null}
                </label>

                <label className="field">
                  <span>Type</span>
                  <select
                    value={jobForm.type}
                    onChange={(event) => setJobForm({ ...jobForm, type: event.target.value })}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Remote</option>
                  </select>
                  {formErrors.type ? <small>{formErrors.type}</small> : null}
                </label>

                <label className="field field--wide">
                  <span>Location</span>
                  <input
                    type="text"
                    placeholder="Bengaluru"
                    value={jobForm.location}
                    onChange={(event) => setJobForm({ ...jobForm, location: event.target.value })}
                  />
                  {formErrors.location ? <small>{formErrors.location}</small> : null}
                </label>

                <div className="form-footer">
                  <button className="primary-button" type="submit" disabled={isSavingJob}>
                    {isSavingJob ? 'Saving...' : editingJobId ? 'Update job' : 'Create job'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : (
          <section className="listing-layout">
            <div className="panel panel--wide">
              <div className="panel-heading panel-heading--stacked">
                <div>
                  <h3>{view === 'jobs' ? 'Created jobs' : 'Saved jobs'}</h3>
                </div>
                <div className="filters">
                  <input
                    type="search"
                    placeholder="Search title, type, or location"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                    {jobTypes.map((jobType) => (
                      <option key={jobType} value={jobType}>
                        {jobType}
                      </option>
                    ))}
                  </select>
                  <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isLoadingJobs ? (
                <div className="empty-state">
                  <div className="spinner" aria-hidden="true" />
                  <p>Loading jobs from Supabase...</p>
                </div>
              ) : paginatedJobs.length ? (
                <>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Salary</th>
                          <th>Location</th>
                          <th>Type</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedJobs.map((job) => {
                          const isSaved = savedJobIds.includes(job.id)
                          const isBusy = busyJobId === job.id

                          return (
                            <tr key={job.id}>
                              <td data-label="Title">{job.title}</td>
                              <td data-label="Salary">₹{Number(job.salary).toLocaleString()}</td>
                              <td data-label="Location">{job.location}</td>
                              <td data-label="Type">{job.type}</td>
                              <td data-label="Created">{new Date(job.created_at).toLocaleDateString()}</td>
                              <td data-label="Actions">
                                <div className="row-actions">
                                  {view === 'jobs' ? (
                                    <>
                                      <button
                                        className="chip-button chip-button--icon"
                                        type="button"
                                        onClick={() => handleEdit(job)}
                                        aria-label={`Edit ${job.title}`}
                                        title="Edit"
                                      >
                                        <ActionIcon type="edit" />
                                      </button>
                                      <button
                                        className="chip-button chip-button--icon"
                                        type="button"
                                        onClick={() => void toggleSavedJob(job.id)}
                                        disabled={isBusy}
                                        aria-label={`${isSaved ? 'Unsave' : 'Save'} ${job.title}`}
                                        title={isBusy ? 'Working...' : isSaved ? 'Unsave' : 'Save'}
                                      >
                                        <ActionIcon type="save" active={isSaved} />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      className="chip-button chip-button--icon"
                                      type="button"
                                      onClick={() => void toggleSavedJob(job.id)}
                                      disabled={isBusy}
                                      aria-label={`Unsave ${job.title}`}
                                      title={isBusy ? 'Working...' : 'Unsave'}
                                    >
                                      <ActionIcon type="save" active={true} />
                                    </button>
                                  )}
                                  <button
                                    className="chip-button chip-button--icon chip-button--danger"
                                    type="button"
                                    onClick={() => void handleDelete(job)}
                                    disabled={isBusy}
                                    aria-label={`Delete ${job.title}`}
                                    title={isBusy ? 'Deleting...' : 'Delete'}
                                  >
                                    <ActionIcon type="delete" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="pagination">
                    <p>
                      Page {safePage} of {totalPages}
                    </p>
                    <div className="pagination-actions">
                      <button
                        className="chip-button"
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={safePage === 1}
                      >
                        Previous
                      </button>
                      <button
                        className="chip-button"
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={safePage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <h4>No jobs found</h4>
                  <p>
                    {view === 'saved'
                      ? 'Save a few jobs first or broaden the filters.'
                      : 'Create the first job listing to populate the table.'}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </section>

      {toast ? <Toast tone={toast.tone} message={toast.message} /> : null}
    </main>
  )
}

function Toast({ message, tone }) {
  return (
    <div className={tone === 'error' ? 'toast toast--error' : 'toast'} role="status" aria-live="polite">
      {message}
    </div>
  )
}
