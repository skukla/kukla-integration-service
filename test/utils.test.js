/* 
* <license header>
*/

const sharedUtils = require('../actions/shared/utils')
const backendUtils = require('../actions/backend/utils')

describe('shared utils', () => {
  test('interface', () => {
    expect(typeof sharedUtils.errorResponse).toBe('function')
    expect(typeof sharedUtils.stringParameters).toBe('function')
    expect(typeof sharedUtils.checkMissingRequestInputs).toBe('function')
    expect(typeof sharedUtils.getBearerToken).toBe('function')
  })

  describe('errorResponse', () => {
    test('(400, errorMessage)', () => {
      const res = sharedUtils.errorResponse(400, 'errorMessage')
      expect(res).toEqual({
        error: {
          statusCode: 400,
          body: { error: 'errorMessage' }
        }
      })
    })

    test('(400, errorMessage, logger)', () => {
      const logger = {
        info: jest.fn()
      }
      const res = sharedUtils.errorResponse(400, 'errorMessage', logger)
      expect(logger.info).toHaveBeenCalledWith('400: errorMessage')
      expect(res).toEqual({
        error: {
          statusCode: 400,
          body: { error: 'errorMessage' }
        }
      })
    })
  })

  describe('stringParameters', () => {
    test('no auth header', () => {
      const params = {
        a: 1, b: 2, __ow_headers: { 'x-api-key': 'fake-api-key' }
      }
      expect(sharedUtils.stringParameters(params)).toEqual(JSON.stringify(params))
    })
    test('with auth header', () => {
      const params = {
        a: 1, b: 2, __ow_headers: { 'x-api-key': 'fake-api-key', authorization: 'secret' }
      }
      expect(sharedUtils.stringParameters(params)).toEqual(expect.stringContaining('"authorization":"<hidden>"'))
      expect(sharedUtils.stringParameters(params)).not.toEqual(expect.stringContaining('secret'))
    })
  })

  describe('checkMissingRequestInputs', () => {
    test('({ a: 1, b: 2 }, [a])', () => {
      expect(sharedUtils.checkMissingRequestInputs({ a: 1, b: 2 }, ['a'])).toEqual(null)
    })
    test('({ a: 1 }, [a, b])', () => {
      expect(sharedUtils.checkMissingRequestInputs({ a: 1 }, ['a', 'b'])).toEqual('missing parameter(s) \'b\'')
    })
    test('({ a: { b: { c: 1 } }, f: { g: 2 } }, [a.b.c, f.g.h.i])', () => {
      expect(sharedUtils.checkMissingRequestInputs({ a: { b: { c: 1 } }, f: { g: 2 } }, ['a.b.c', 'f.g.h.i'])).toEqual('missing parameter(s) \'f.g.h.i\'')
    })
    test('({ a: { b: { c: 1 } }, f: { g: 2 } }, [a.b.c, f.g.h])', () => {
      expect(sharedUtils.checkMissingRequestInputs({ a: { b: { c: 1 } }, f: { g: 2 } }, ['a.b.c', 'f'])).toEqual(null)
    })
    test('({ a: 1, __ow_headers: { h: 1, i: 2 } }, undefined, [h])', () => {
      expect(sharedUtils.checkMissingRequestInputs({ a: 1, __ow_headers: { h: 1, i: 2 } }, undefined, ['h'])).toEqual(null)
    })
    test('({ a: 1, __ow_headers: { f: 2 } }, [a], [h, i])', () => {
      expect(sharedUtils.checkMissingRequestInputs({ a: 1, __ow_headers: { f: 2 } }, ['a'], ['h', 'i'])).toEqual('missing header(s) \'h,i\'')
    })
    test('({ c: 1, __ow_headers: { f: 2 } }, [a, b], [h, i])', () => {
      expect(sharedUtils.checkMissingRequestInputs({ c: 1 }, ['a', 'b'], ['h', 'i'])).toEqual('missing header(s) \'h,i\' and missing parameter(s) \'a,b\'')
    })
    test('({ a: 0 }, [a])', () => {
      expect(sharedUtils.checkMissingRequestInputs({ a: 0 }, ['a'])).toEqual(null)
    })
    test('({ a: null }, [a])', () => {
      expect(sharedUtils.checkMissingRequestInputs({ a: null }, ['a'])).toEqual(null)
    })
    test('({ a: \'\' }, [a])', () => {
      expect(sharedUtils.checkMissingRequestInputs({ a: '' }, ['a'])).toEqual('missing parameter(s) \'a\'')
    })
    test('({ a: undefined }, [a])', () => {
      expect(sharedUtils.checkMissingRequestInputs({ a: undefined }, ['a'])).toEqual('missing parameter(s) \'a\'')
    })
  })

  describe('getBearerToken', () => {
    test('({})', () => {
      expect(sharedUtils.getBearerToken({})).toEqual(undefined)
    })
    test('({ authorization: Bearer fake, __ow_headers: {} })', () => {
      expect(sharedUtils.getBearerToken({ authorization: 'Bearer fake', __ow_headers: {} })).toEqual(undefined)
    })
    test('({ authorization: Bearer fake, __ow_headers: { authorization: fake } })', () => {
      expect(sharedUtils.getBearerToken({ authorization: 'Bearer fake', __ow_headers: { authorization: 'fake' } })).toEqual(undefined)
    })
    test('({ __ow_headers: { authorization: Bearerfake} })', () => {
      expect(sharedUtils.getBearerToken({ __ow_headers: { authorization: 'Bearerfake' } })).toEqual(undefined)
    })
    test('({ __ow_headers: { authorization: Bearer fake} })', () => {
      expect(sharedUtils.getBearerToken({ __ow_headers: { authorization: 'Bearer fake' } })).toEqual('fake')
    })
    test('({ __ow_headers: { authorization: Bearer fake Bearer fake} })', () => {
      expect(sharedUtils.getBearerToken({ __ow_headers: { authorization: 'Bearer fake Bearer fake' } })).toEqual('fake Bearer fake')
    })
  })
})

describe('backend utils', () => {
  test('interface', () => {
    expect(typeof backendUtils.errorResponse).toBe('function')
    expect(typeof backendUtils.buildHeaders).toBe('function')
    expect(typeof backendUtils.validateAdminCredentials).toBe('function')
    expect(typeof backendUtils.fetchAdminToken).toBe('function')
  })

  describe('errorResponse', () => {
    test('(400, errorMessage)', () => {
      const res = backendUtils.errorResponse(400, 'errorMessage')
      expect(res).toEqual({
        error: {
          statusCode: 400,
          body: { error: 'errorMessage' }
        }
      })
    })

    test('(400, errorMessage, logger)', () => {
      const logger = {
        warn: jest.fn()
      }
      const res = backendUtils.errorResponse(400, 'errorMessage', logger)
      expect(logger.warn).toHaveBeenCalledWith('400: errorMessage')
      expect(res).toEqual({
        error: {
          statusCode: 400,
          body: { error: 'errorMessage' }
        }
      })
    })
  })
})
