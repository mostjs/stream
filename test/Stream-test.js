/** @license MIT License (c) copyright 2016 original author or authors */

import {describe, it} from 'mocha'
import assert from 'assert'

import Stream from '../src/Stream'

// TODO: Write more tests

describe('Stream', () => {
  it('should create a Stream from source', () => {
    const source = { run: () => undefined }
    assert.strictEqual(source, new Stream(source).source)
  })
})
