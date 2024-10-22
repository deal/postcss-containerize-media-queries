const postcss = require('postcss')
const snakeCase = require('lodash/snakeCase')

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
  breakpointXs: `(min-width: ${breakpoints.breakpointXs})`,
  breakpointSm: `(min-width: ${breakpoints.breakpointSm})`,
  breakpointMd: `(min-width: ${breakpoints.breakpointMd})`,
  breakpointLg: `(min-width: ${breakpoints.breakpointLg})`,
  breakpointXlg: `(min-width: ${breakpoints.breakpointXlg})`,
  breakpointXxlg: `(min-width: ${breakpoints.breakpointXxlg})`,
  breakpointLtXs: `(max-width: ${parseInt(breakpoints.breakpointXs) - 1}px)`,
  breakpointLtSm: `(max-width: ${parseInt(breakpoints.breakpointSm) - 1}px)`,
  breakpointLtMd: `(max-width: ${parseInt(breakpoints.breakpointMd) - 1}px)`,
  breakpointLtLg: `(max-width: ${parseInt(breakpoints.breakpointLg) - 1}px)`,
  breakpointLtXlg: `(max-width: ${parseInt(breakpoints.breakpointXlg) - 1}px)`,
  breakpointLtXxlg: `(max-width: ${parseInt(breakpoints.breakpointXxlg) - 1}px)`,
  bluxomeMediaMd: `(min-width: ${breakpoints.bluxomeBreakpointMd})`,
  bluxomeMediaLg: `(min-width: ${breakpoints.bluxomeBreakpointLg})`,
  bluxomeMediaXlg: `(min-width: ${breakpoints.bluxomeBreakpointXlg})`,
  bluxomeMediaLtMd: `(max-width: ${breakpoints.bluxomeBreakpointLtMd})`,
  bluxomeMediaLtLg: `(max-width: ${breakpoints.bluxomeBreakpointLtLg})`,
  bluxomeMediaLtXlg: `(max-width: ${breakpoints.bluxomeBreakpointLtXlg})`,
  'media-md': `(min-width: ${breakpoints.bluxomeBreakpointMd})`,
  'media-lg': `(min-width: ${breakpoints.bluxomeBreakpointLg})`,
  'media-xlg': `(min-width: ${breakpoints.bluxomeBreakpointXlg})`,
  'media-lt-md': `(max-width: ${breakpoints.bluxomeBreakpointLtMd})`,
  'media-lt-lg': `(max-width: ${breakpoints.bluxomeBreakpointLtLg})`,
  'media-lt-xlg': `(max-width: ${breakpoints.bluxomeBreakpointLtXlg})`,
}

const processed = Symbol('processed')

module.exports = (opts = { replaceVwUnit: false }) => {
  return {
    postcssPlugin: 'postcss-containerize-media-queries',
    prepare() {
      return {
        Declaration(node) {
          if (opts.replaceVwUnit && isTransformableVwDecl(node) && !isNestedInAtRule(node)) {
            /**
             * Duplicate any declarations that use the `vw` unit, unless they are nested in a @media/@container rule
             *
             * Preserves the original, `vw`-based declaration because the cloned, `cqi`-based declaration may be ignored if unsupported
             */
            node.cloneAfter({ value: getVwDeclValueAsCqi(node) })
          }
        },
        OnceExit(css) {
          css.walkAtRules(/media/i, (atRule) => {
            if (atRule[processed] || atRule.parent[processed]) {
              // Avoid infinite loop by ignoring rules added by this plugin
              return
            }
            const params = atRule.params.trim()
            const mediaQueryEntry = Object.entries(mediaQueries).find(([alias, value]) => {
              return (
                params === value ||
                params.toLowerCase().includes(alias.toLowerCase()) ||
                params.includes(snakeCase(alias))
              )
            })
            const mediaQuery = mediaQueryEntry && mediaQueryEntry[1]
            if (!mediaQuery) {
              // Ignore if rule's media query isn't one of our standard ones
              return
            }
            // Create a fallback @supports rule that wraps the original @media rule
            const fallbackRule = postcss
              .atRule({
                name: 'supports',
                params: 'not (contain: inline-size)',
              })
              .append(atRule.clone({ params: mediaQuery, raws: { before: '\n' } }))
            // Create a @container rule to replace the @media rule
            const containerRule = atRule.clone({
              name: 'container',
              params: mediaQuery,
              nodes: opts.replaceVwUnit ? replaceVwDeclValuesWithCqi(atRule.nodes) : atRule.nodes,
            })

            atRule[processed] = true
            fallbackRule[processed] = true
            containerRule[processed] = true

            atRule.parent.insertAfter(atRule, fallbackRule)
            atRule.parent.insertAfter(fallbackRule, containerRule)
            atRule.remove()
          })
        },
      }
    },
  }
}

module.exports.postcss = true

/**
 * Replaces the `vw` unit with the `cqi` unit in width and custom variable declarations
 *
 * Only for use within @container rules because the original, `vw`-based declaration is _not_ preserved
 *
 */
function replaceVwDeclValuesWithCqi(nodes) {
  nodes.forEach((node, i) => {
    if (isTransformableVwDecl(node)) {
      nodes[i] = node.clone({ value: getVwDeclValueAsCqi(node) })
      return
    }
    if (node.type === 'rule' && node.nodes.some(isTransformableVwDecl)) {
      nodes[i].nodes = replaceVwDeclValuesWithCqi(node.nodes)
      return
    }
  })
  return nodes
}

/**
 * Checks whether the node is nested in an @media or @container rule by recursively walking the node's parents
 */
function isNestedInAtRule(node) {
  if (!node.parent || node.parent.type === 'root') {
    return false
  }
  if (node.parent.type === 'atrule') {
    return ['media', 'container'].includes(node.parent.name)
  }
  return isNestedInAtRule(node.parent)
}

/**
 * Checks whether the node is a width or custom variable declaration that includes the `vw` unit
 */
function isTransformableVwDecl(node) {
  if (node.type === 'decl' && node.prop && node.value) {
    if (['width', 'max-width', 'min-width'].includes(node.prop) || node.prop.startsWith('--')) {
      return node.value.includes('vw')
    }
  }
  return false
}

function getVwDeclValueAsCqi(node) {
  let newValue = node.value.slice()
  newValue = newValue.replace(/svw/g, 'cqi')
  newValue = newValue.replace(/dvw/g, 'cqi')
  newValue = newValue.replace(/vw/g, 'cqi')
  return newValue
}
