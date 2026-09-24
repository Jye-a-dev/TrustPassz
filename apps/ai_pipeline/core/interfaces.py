from abc import ABC, abstractmethod
from typing import Type, TypeVar
from PIL import Image
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

class IConstrainedVisionEngine(ABC):
    @abstractmethod
    def load_model(self) -> None:
        pass

    @abstractmethod
    def infer_with_schema(self, image: Image.Image, prompt: str, schema: Type[T]) -> T:
        pass

    @abstractmethod
    def is_ready(self) -> bool:
        pass
