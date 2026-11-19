import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NameForm, validBuildName } from './name-form'

describe('validBuildName', () => {
    it.each<[string, string, boolean]>([
        ['empty', '', false],
        ['whitespace only', '   \t ', false],
        ['one character', 'a', true],
        ['one character with padding', '  a  ', true],
        ['100 characters', 'a'.repeat(100), true],
        ['100 characters with padding', ` ${'a'.repeat(100)} `, true],
        ['101 characters', 'a'.repeat(101), false],
    ])('for %s is %s', (_, name, valid) => {
        expect(validBuildName(name)).toBe(valid)
    })
})

interface FormProps {
    initialName?: string
    unchangedName?: string
    canSubmit?: boolean
}

function render({ initialName = 'Fast castle', unchangedName, canSubmit = true }: FormProps): string {
    return renderToStaticMarkup(
        createElement(NameForm, {
            testIdPrefix: 'rename',
            label: 'New name',
            submitText: 'Save name',
            initialName,
            unchangedName,
            canSubmit,
            onSubmit: () => {},
            onCancel: () => {},
        }),
    )
}

function tag(html: string, testId: string): string | undefined {
    return new RegExp(`<(?:button|input|div)[^>]*data-testid="${testId}"[^>]*>`).exec(html)?.[0]
}

describe('NameForm', () => {
    it('renders the group, input, submit and cancel under the prefix test ids with the given texts', () => {
        const html = render({})
        expect(tag(html, 'rename-form')).toContain('role="group"')
        expect(tag(html, 'rename-form')).toContain('aria-label="Rename"')
        expect(tag(html, 'rename-name')).toContain('aria-label="New name"')
        expect(tag(html, 'rename-name')).toContain('value="Fast castle"')
        expect(html).toMatch(/data-testid="rename-submit"[^>]*>Save name</)
        expect(html).toMatch(/data-testid="rename-cancel"[^>]*>Cancel</)
    })

    it('enables submit for a valid name that differs from the unchanged name', () => {
        expect(tag(render({ unchangedName: 'Old name' }), 'rename-submit')).not.toContain('disabled')
    })

    it('disables submit with no error while the trimmed name equals the unchanged name', () => {
        const html = render({ initialName: '  Fast castle ', unchangedName: 'Fast castle' })
        expect(tag(html, 'rename-submit')).toContain('disabled=""')
        expect(html).not.toContain('rename-name-error')
        expect(tag(html, 'rename-name')).not.toContain('aria-invalid')
        expect(tag(html, 'rename-name')).not.toContain('is-invalid')
    })

    it.each<[string, string]>([
        ['empty', ''],
        ['whitespace only', '   '],
        ['over 100 characters', 'a'.repeat(101)],
    ])('for a name that is %s disables submit and shows the range message with aria-invalid', (_, initialName) => {
        const html = render({ initialName, unchangedName: 'Fast castle' })
        expect(tag(html, 'rename-submit')).toContain('disabled=""')
        expect(tag(html, 'rename-name')).toContain('aria-invalid="true"')
        expect(tag(html, 'rename-name')).toContain('aria-describedby="rename-name-error"')
        expect(tag(html, 'rename-name')).toMatch(/class="[^"]*\bis-invalid\b/)
        expect(tag(html, 'rename-name-error')).toContain('invalid-feedback')
        expect(html).toMatch(/id="rename-name-error"[^>]*>Enter a name of 1 to 100 characters\.</)
    })

    it('disables submit for a valid changed name when the outside conditions do not allow it', () => {
        const html = render({ unchangedName: 'Old name', canSubmit: false })
        expect(tag(html, 'rename-submit')).toContain('disabled=""')
        expect(html).not.toContain('rename-name-error')
    })

    it('names the group Save as copy for the copy prefix', () => {
        const html = renderToStaticMarkup(
            createElement(NameForm, {
                testIdPrefix: 'save-copy',
                label: 'Name of the copy',
                submitText: 'Save copy',
                initialName: 'x (copy)',
                canSubmit: true,
                onSubmit: () => {},
                onCancel: () => {},
            }),
        )
        expect(tag(html, 'save-copy-form')).toContain('aria-label="Save as copy"')
        expect(tag(html, 'save-copy-submit')).not.toContain('disabled')
    })
})
