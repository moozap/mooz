import { fillStr } from '../index'

describe('../core', () => {
  test('fillStr', () => {
    expect(fillStr('#', 5)).toEqual('#####')
  })
})
