import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserRequestDto } from './dto/request/create-user.dto';
import { UserResponseDto } from './dto/response/user-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: Partial<Record<keyof UsersService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('getAll', () => {
    it('should return array of UserResponseDto', async () => {
      const users: UserResponseDto[] = [{ id: 1, nickname: 'a' }];
      service.findAll!.mockResolvedValue(users);

      await expect(controller.getAll()).resolves.toEqual(users);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should call service.create and return UserResponseDto', async () => {
      const dto: CreateUserRequestDto = {
        nickname: 'mary',
        password: 'Abc123!@',
      };
      const created: UserResponseDto = { id: 2, nickname: 'mary' };
      service.create!.mockResolvedValue(created);

      await expect(controller.create(dto)).resolves.toEqual(created);
      expect(service.create).toHaveBeenCalledWith(dto.nickname, dto.password);
    });
  });
});
