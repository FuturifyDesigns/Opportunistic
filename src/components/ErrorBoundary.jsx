import { Component } from 'react'
import { Link } from 'react-router-dom'
import i18n from '../i18n'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const title = i18n.t('errorBoundary.title', { defaultValue: 'Something went wrong' })
    const body = i18n.t('errorBoundary.body', {
      defaultValue: 'This page hit an unexpected error. Reload or go back home.',
    })
    const reload = i18n.t('errorBoundary.reload', { defaultValue: 'Reload page' })
    const home = i18n.t('common.home', { defaultValue: 'Home' })

    return (
      <div className="page-center error-boundary">
        <div className="glass-panel error-boundary-panel">
          <h1>{title}</h1>
          <p>{body}</p>
          <div className="cta-row">
            <button type="button" className="btn" onClick={() => window.location.reload()}>
              {reload}
            </button>
            <Link className="btn btn-ghost" to="/home">
              {home}
            </Link>
          </div>
        </div>
      </div>
    )
  }
}
