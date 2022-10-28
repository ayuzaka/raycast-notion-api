type Success<T> = {
  type: "success";
  data: T;
};

type Failure = {
  type: "failure";
  err: {
    name: string;
    message: string;
  };
};

export type Result<T> = Success<T> | Failure;
