'use strict'

const _ = require('lodash')

class PullRequests {
  constructor(prs, owner, repo) {
    this.prs = prs
    this.owner = owner
    this.repo = repo

    _.bindAll(this, ['belongsToOwner', 'matchesRepo'])
  }

  isIgnorable(pr) {
    const ignoreWords = ['wip', 'dontmerge', 'donotmerge']
    const regex = new RegExp(`(${ignoreWords.join('|')})`, 'i')
    const sanitizedTitle = pr.title.replace(/'|\s+/g, '')
    return !!sanitizedTitle.match(regex)
  }

  belongsToOwner(pr) {
    if (this.owner.value) {
      const result = pr.html_url.match('^https://github.com/([^/]+)/')[1] === this.owner.value
      return (this.owner.inclusion ? result : !result)
    } else {
      return true
    }
  }

  matchesRepo(pr) {
    if (this.repo.value.length > 0) {
      const result = _.some(this.repo.value, (repo) => {
        return pr.html_url.match('^https://github.com/([^/]+/[^/]+)/')[1] === repo
      })
      return (this.repo.inclusion ? result : !result)
    } else {
      return true
    }
  }

  formatPullRequest(pr, index) {
    return {
      text: `${index+1}. \`${pr.title}\` ${pr.html_url} by ${pr.user.login}`,
      link_names: 0,
    }
  }

  convertToSlackMessages() {
    return _(this.prs).flatMap((prs) => prs.data.items)
      .reject(this.isIgnorable)
      .filter(this.belongsToOwner)
      .filter(this.matchesRepo)
      .map(this.formatPullRequest)
      .value()
  }
}

module.exports = PullRequests
