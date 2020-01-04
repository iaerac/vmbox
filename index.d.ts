
interface Config {
  asyncTimeout?: number,
  timeout?: number
}

declare class VMBox {
  constructor(config: Config) {

  }

  run(code: string, { context: any } = {}, stack?: boolean) {

  }
}

export default VMBox