/* 
* <license header>
*/

const { Core } = require('@adobe/aio-sdk');
const { buildHeaders, getBearerToken } = require('../actions/shared/http/headers');
const { errorResponse } = require('../actions/shared/http/response');
const { checkMissingRequestInputs } = require('../actions/shared/validation/input');
const { validateAdminCredentials, fetchAdminToken } = require('../actions/shared/commerce/auth');

describe('shared utils', () => {
  test('interface', () => {
    expect(typeof errorResponse).toBe('function')
    expect(typeof checkMissingRequestInputs).toBe('function')
    expect(typeof getBearerToken).toBe('function')
  })

  describe('errorResponse', () => {
    test('(400, errorMessage)', () => {
      const res = errorResponse(400, 'errorMessage')
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
      const res = errorResponse(400, 'errorMessage', logger)
      expect(logger.info).toHaveBeenCalledWith('400: errorMessage')
      expect(res).toEqual({
        error: {
          statusCode: 400,
          body: { error: 'errorMessage' }
        }
      })
    })
  })

  describe('checkMissingRequestInputs', () => {
    test('({ a: 1, b: 2 }, [a])', () => {
      expect(checkMissingRequestInputs({ a: 1, b: 2 }, ['a'])).toEqual(null)
    })
    test('({ a: 1 }, [a, b])', () => {
      expect(checkMissingRequestInputs({ a: 1 }, ['a', 'b'])).toEqual('missing parameter(s) \'b\'')
    })
    test('({ a: { b: { c: 1 } }, f: { g: 2 } }, [a.b.c, f.g.h.i])', () => {
      expect(checkMissingRequestInputs({ a: { b: { c: 1 } }, f: { g: 2 } }, ['a.b.c', 'f.g.h.i'])).toEqual('missing parameter(s) \'f.g.h.i\'')
    })
    test('({ a: { b: { c: 1 } }, f: { g: 2 } }, [a.b.c, f.g.h])', () => {
      expect(checkMissingRequestInputs({ a: { b: { c: 1 } }, f: { g: 2 } }, ['a.b.c', 'f'])).toEqual(null)
    })
    test('({ a: 1, __ow_headers: { h: 1, i: 2 } }, undefined, [h])', () => {
      expect(checkMissingRequestInputs({ a: 1, __ow_headers: { h: 1, i: 2 } }, undefined, ['h'])).toEqual(null)
    })
    test('({ a: 1, __ow_headers: { f: 2 } }, [a], [h, i])', () => {
      expect(checkMissingRequestInputs({ a: 1, __ow_headers: { f: 2 } }, ['a'], ['h', 'i'])).toEqual('missing header(s) \'h,i\'')
    })
    test('({ c: 1, __ow_headers: { f: 2 } }, [a, b], [h, i])', () => {
      expect(checkMissingRequestInputs({ c: 1 }, ['a', 'b'], ['h', 'i'])).toEqual('missing header(s) \'h,i\' and missing parameter(s) \'a,b\'')
    })
    test('({ a: 0 }, [a])', () => {
      expect(checkMissingRequestInputs({ a: 0 }, ['a'])).toEqual(null)
    })
    test('({ a: null }, [a])', () => {
      expect(checkMissingRequestInputs({ a: null }, ['a'])).toEqual(null)
    })
    test('({ a: \'\' }, [a])', () => {
      expect(checkMissingRequestInputs({ a: '' }, ['a'])).toEqual('missing parameter(s) \'a\'')
    })
    test('({ a: undefined }, [a])', () => {
      expect(checkMissingRequestInputs({ a: undefined }, ['a'])).toEqual('missing parameter(s) \'a\'')
    })
  })

  describe('getBearerToken', () => {
    test('({})', () => {
      expect(getBearerToken({})).toEqual(undefined)
    })
    test('({ authorization: Bearer fake, __ow_headers: {} })', () => {
      expect(getBearerToken({ authorization: 'Bearer fake', __ow_headers: {} })).toEqual(undefined)
    })
    test('({ authorization: Bearer fake, __ow_headers: { authorization: fake } })', () => {
      expect(getBearerToken({ authorization: 'Bearer fake', __ow_headers: { authorization: 'fake' } })).toEqual(undefined)
    })
    test('({ __ow_headers: { authorization: Bearerfake} })', () => {
      expect(getBearerToken({ __ow_headers: { authorization: 'Bearerfake' } })).toEqual(undefined)
    })
    test('({ __ow_headers: { authorization: Bearer fake} })', () => {
      expect(getBearerToken({ __ow_headers: { authorization: 'Bearer fake' } })).toEqual('fake')
    })
    test('({ __ow_headers: { authorization: Bearer fake Bearer fake} })', () => {
      expect(getBearerToken({ __ow_headers: { authorization: 'Bearer fake Bearer fake' } })).toEqual('fake Bearer fake')
    })
  })
})

describe('commerce utils', () => {
  test('interface', () => {
    expect(typeof validateAdminCredentials).toBe('function')
    expect(typeof fetchAdminToken).toBe('function')
    expect(typeof buildHeaders).toBe('function')
  })

  describe('errorResponse', () => {
    test('(400, errorMessage)', () => {
      const res = errorResponse(400, 'errorMessage')
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
      const res = errorResponse(400, 'errorMessage', logger)
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
