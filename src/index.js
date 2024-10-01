const postcss = require('postcss')

const breakpoints = {
  breakpointXs: '360px',
  breakpointSm: '768px',
  breakpointMd: '960px',
  breakpointLg: '1200px',
  breakpointXlg: '1440px',
  breakpointXxlg: '1600px',
  bluxomeBreakpointMd: '768px',
  bluxomeBreakpointLg: '1040px',
  bluxomeBreakpointXlg: '1440px',
  bluxomeBreakpointLtMd: '767px',
  bluxomeBreakpointLtLg: '1039px',
  bluxomeBreakpointLtXlg: '1439px',
}

const mediaQueries = {
  mBreakpointXs: `(min-width: ${breakpoints.breakpointXs})`,
  mBreakpointSm: `(min-width: ${breakpoints.breakpointSm})`,
  mBreakpointMd: `(min-width: ${breakpoints.breakpointMd})`,
  mBreakpointLg: `(min-width: ${breakpoints.breakpointLg})`,
  mBreakpointXlg: `(min-width: ${breakpoints.breakpointXlg})`,
  mBreakpointXxlg: `(min-width: ${breakpoints.breakpointXxlg})`,
  mBreakpointLtXs: `(max-width: ${parseInt(breakpoints.breakpointXs) - 1}px)`,
  mBreakpointLtSm: `(max-width: ${parseInt(breakpoints.breakpointSm) - 1}px)`,
  mBreakpointLtMd: `(max-width: ${parseInt(breakpoints.breakpointMd) - 1}px)`,
  mBreakpointLtLg: `(max-width: ${parseInt(breakpoints.breakpointLg) - 1}px)`,
  mBreakpointLtXlg: `(max-width: ${parseInt(breakpoints.breakpointXlg) - 1}px)`,
  mBreakpointLtXxlg: `(max-width: ${parseInt(breakpoints.breakpointXxlg) - 1}px)`,
  bluxomeMediaMd: `(min-width: ${breakpoints.bluxomeBreakpointMd})`,
  bluxomeMediaLg: `(min-width: ${breakpoints.bluxomeBreakpointLg})`,
  bluxomeMediaXlg: `(min-width: ${breakpoints.bluxomeBreakpointXlg})`,
  bluxomeMediaLtMd: `(max-width: ${breakpoints.bluxomeBreakpointLtMd})`,
  bluxomeMediaLtLg: `(max-width: ${breakpoints.bluxomeBreakpointLtLg})`,
  bluxomeMediaLtXlg: `(max-width: ${breakpoints.bluxomeBreakpointLtXlg})`,
}

module.exports = () => {
  return {
    postcssPlugin: 'postcss-containerize-media-queries',
    Root: (root) => {
      // Iterate over all @media rules to copy their logic into @container rules
      // Create fallback @media rules nested in @supports rules in case @container is not supported
      root.walkAtRules((atRule) => {
        const { name, parent } = atRule
        if (
          name !== 'media' ||
          (parent.type === 'atrule' &&
            parent.name === 'supports' &&
            parent.params === 'not (contain: inline-size)')
        ) {
          // Skip if rule is not @media, or if rule is already nested inside a @supports rule
          return
        }
        const params = atRule.params.trim()
        if (!Object.values(mediaQueries).includes(params)) {
          // Ignore any @media rules that don't use standard breakpoints
          return
        }
        // Create a fallback that duplicates the @media rule only if @container rules are not supported
        const fallbackRule = postcss.atRule({
          name: 'supports',
          params: 'not (contain: inline-size)',
        })
        fallbackRule.append(atRule.clone())

        // Create a new @container rule that's a copy of the @media rule
        const containerRule = postcss.atRule({
          name: 'container',
          params: params,
        })
        containerRule.append(atRule.nodes)

        parent.insertAfter(atRule, fallbackRule)
        parent.insertAfter(fallbackRule, containerRule)
        atRule.remove()
      })
    },
  }
}

module.exports.postcss = true
